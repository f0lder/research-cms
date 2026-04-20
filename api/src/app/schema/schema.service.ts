import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContentType, ContentTypeDocument } from './schemas/content-type.schema';
import { ContentEntryModel, ContentEntryDocument } from '../content/schemas/content-entry.schema';
import { ContentTypeDefinition, FieldDefinition } from '@research-cms/shared-types';
import { LogsService } from '../logs/logs.service';
import { CmsEvents, SchemaCreatedEvent, SchemaUpdatedEvent, SchemaDeletedEvent } from '../events';

@Injectable()
export class SchemaService {
	constructor(
		@InjectModel(ContentType.name) private model: Model<ContentTypeDocument>,
		@InjectModel(ContentEntryModel.name) private entryModel: Model<ContentEntryDocument>,
		private readonly logsService: LogsService,
		private readonly eventEmitter: EventEmitter2,
	) {}

	/** Validates that a slug contains only URL-safe characters. */
	private validateSlug(slug: string): void {
		if (!/^[a-z0-9_-]+$/.test(slug)) {
			throw new BadRequestException(
				'Slug must contain only lowercase letters, numbers, hyphens and underscores'
			);
		}
	}

	/** Returns all schemas that have at least one reference/references field targeting the given slug. */
	private async findSchemasReferencingSlug(slug: string): Promise<ContentTypeDocument[]> {
		return this.model.find({ 'fields.config.targetSlug': slug }).exec();
	}

	async create(data: ContentTypeDefinition): Promise<ContentTypeDocument> {
		if (!data.fields || data.fields.length === 0) {
			throw new BadRequestException('Schema requires at least one field');
		}
		this.validateSlug(data.slug);
		try {
			const schema = await this.model.create(data);
			void this.logsService.log(`Schema created: "${data.name}" (${data.slug})`, ['schema', 'create'], { slug: data.slug });
			this.eventEmitter.emit(CmsEvents.SCHEMA_CREATED, new SchemaCreatedEvent(schema.slug, schema.name));
			return schema;
		} catch (error) {
			const mongoError = error as { code?: number; message?: string };
			if (mongoError.code === 11000) {
				throw new BadRequestException(`Schema with slug "${data.slug}" already exists`);
			}
			throw new BadRequestException(mongoError.message || 'Schema creation failed');
		}
	}

	async findAll(): Promise<ContentTypeDocument[]> {
		return this.model.find({ system: { $ne: true } }).exec();
	}

	async findSystem(): Promise<ContentTypeDocument[]> {
		return this.model.find({ system: true }).exec();
	}

	async findOne(slug: string): Promise<ContentTypeDocument> {
		const schema = await this.model.findOne({ slug }).exec();
		if (!schema) {
			throw new BadRequestException(`Schema with slug "${slug}" not found`);
		}
		return schema;
	}

	async findById(id: string): Promise<ContentTypeDocument> {
		const schema = await this.model.findById(id).exec();
		if (!schema) {
			throw new BadRequestException(`Schema with id "${id}" not found`);
		}
		return schema;
	}

	async update(slug: string, data: Omit<Partial<ContentTypeDefinition>, '_id'>): Promise<ContentTypeDocument> {
		const schema = await this.findOne(slug);
		if (schema.system) throw new BadRequestException(`"${schema.name}" is a system schema and cannot be modified`);

		if (data.fields && data.fields.length === 0) {
			throw new BadRequestException('Schema requires at least one field');
		}
		if (data.slug) this.validateSlug(data.slug);

		const newSlug = data.slug;
		const isRename = !!newSlug && newSlug !== slug;

		if (isRename) {
			// Fetch referencing schemas once and reuse for both the cascade and any future checks
			const referencing = await this.findSchemasReferencingSlug(slug);

			/**
			 * Cascade rename is executed in a MongoDB transaction so all three writes
			 * (entries, referencing schemas, schema itself) succeed or fail atomically.
			 * Requires a replica set or Atlas — on standalone MongoDB this will throw and
			 * fall back to a non-transactional error. Known limitation documented in thesis.
			 */
			const session = await this.model.db.startSession();
			try {
				await session.withTransaction(async () => {
					// 1. Re-point all entries that belonged to the old slug
					await this.entryModel
						.updateMany({ schemaSlug: slug }, { $set: { schemaSlug: newSlug } }, { session })
						.exec();

					// 2. Update targetSlug in any reference fields across other schemas
					for (const ref of referencing) {
						const updatedFields = ref.fields.map((f: FieldDefinition) => {
							if (
								(f.config?.type === 'reference' || f.config?.type === 'references') &&
								f.config.targetSlug === slug
							) {
								return { ...f, config: { ...f.config, targetSlug: newSlug } };
							}
							return f;
						});
						await this.model
							.findByIdAndUpdate(ref._id, { $set: { fields: updatedFields } }, { session })
							.exec();
					}

					// 3. Apply the update to the schema itself
					await this.model
						.findByIdAndUpdate(schema._id, { $set: data }, { session, returnDocument: 'after' })
						.exec();
				});
			} finally {
				await session.endSession();
			}

			const updated = await this.findOne(newSlug);
			void this.logsService.log(`Schema renamed: "${slug}" → "${newSlug}"`, ['schema', 'update'], { slug: newSlug });
			this.eventEmitter.emit(CmsEvents.SCHEMA_UPDATED, new SchemaUpdatedEvent(newSlug, slug, updated.name));
			return updated;
		}

		// Non-rename update (no transaction needed — single document write)
		try {
			const updated = await this.model.findByIdAndUpdate(
				schema._id,
				{ $set: data },
				{ returnDocument: 'after' },
			).exec();
			if (!updated) throw new BadRequestException('Schema update failed');
			void this.logsService.log(`Schema updated: "${updated.name}" (${updated.slug})`, ['schema', 'update'], { slug: updated.slug });
			this.eventEmitter.emit(CmsEvents.SCHEMA_UPDATED, new SchemaUpdatedEvent(updated.slug, updated.slug, updated.name));
			return updated;
		} catch (error) {
			const mongoError = error as { code?: number; message?: string };
			if (mongoError.code === 11000) {
				throw new BadRequestException(`Schema with slug "${data.slug}" already exists`);
			}
			throw new BadRequestException(mongoError.message || 'Schema update failed');
		}
	}

	async delete(slug: string): Promise<void> {
		const schema = await this.findOne(slug);
		if (schema.system) throw new BadRequestException(`"${schema.name}" is a system schema and cannot be deleted`);

		// Block deletion if other schemas reference this slug — collect once, reuse
		const referencing = await this.findSchemasReferencingSlug(slug);
		if (referencing.length > 0) {
			const names = referencing.map(s => `"${s.name}" (${s.slug})`).join(', ');
			throw new BadRequestException(
				`Cannot delete "${schema.name}": it is referenced by ${names}. Remove those reference fields first.`
			);
		}

		/**
		 * Schema deletion is also transactional — schema document and all its entries
		 * are removed atomically. Requires replica set / Atlas (same limitation as rename).
		 */
		const session = await this.model.db.startSession();
		try {
			await session.withTransaction(async () => {
				await this.model.findByIdAndDelete(schema._id, { session }).exec();
				await this.entryModel.deleteMany({ schemaSlug: slug }, { session }).exec();
			});
		} finally {
			await session.endSession();
		}

		void this.logsService.log(`Schema deleted: "${schema.name}" (${slug})`, ['schema', 'delete'], { slug });
		this.eventEmitter.emit(CmsEvents.SCHEMA_DELETED, new SchemaDeletedEvent(slug, schema.name));
	}
}
