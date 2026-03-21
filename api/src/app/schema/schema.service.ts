import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContentType, ContentTypeDocument } from './schemas/content-type.schema';
import { ContentEntryModel, ContentEntryDocument } from '../content/schemas/content-entry.schema';
import { ContentTypeDefinition, FieldDefinition } from '@research-cms/shared-types';

@Injectable()
export class SchemaService {
	constructor(
		@InjectModel(ContentType.name) private model: Model<ContentTypeDocument>,
		@InjectModel(ContentEntryModel.name) private entryModel: Model<ContentEntryDocument>,
	) { }

	/** Returns all schemas that have at least one reference/references field targeting the given slug. */
	private async findSchemasReferencingSlug(slug: string): Promise<ContentTypeDocument[]> {
		return this.model.find({ 'fields.config.targetSlug': slug }).exec();
	}

	async create(data: ContentTypeDefinition): Promise<ContentTypeDocument> {
		if (!data.fields || data.fields.length === 0) {
			throw new BadRequestException('Schema requires at least one field');
		}
		try {
			return await this.model.create(data);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	async findAll(): Promise<ContentTypeDocument[]> {
		return this.model.find().exec();
	}

	async findOne(slug: string): Promise<ContentTypeDocument> {
		const schema = await this.model.findOne({ slug }).exec();
		if (!schema) {
			throw new BadRequestException(`Schema with slug "${slug}" not found`);
		}
		return schema;
	}

	async update(slug: string, data: Partial<ContentTypeDefinition>): Promise<ContentTypeDocument> {
		const schema = await this.findOne(slug);

		if (data.fields && data.fields.length === 0) {
			throw new BadRequestException('Schema requires at least one field');
		}

		// If the slug is being renamed, cascade-update all content entries and reference fields
		const newSlug = data.slug;
		if (newSlug && newSlug !== slug) {
			// 1. Re-point all entries that belonged to the old slug
			await this.entryModel.updateMany({ schemaSlug: slug }, { $set: { schemaSlug: newSlug } }).exec();

			// 2. Update targetSlug in any reference fields across other schemas
			const referencing = await this.findSchemasReferencingSlug(slug);
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
				await this.model.findByIdAndUpdate(ref._id, { $set: { fields: updatedFields } }).exec();
			}
		}

		try {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { _id: _ignored, ...safeData } = data as ContentTypeDefinition & { _id?: unknown };
			const updated = await this.model.findByIdAndUpdate(
				schema._id,
				{ $set: safeData },
				{ returnDocument: 'after' }
			).exec();
			if (!updated) throw new BadRequestException('Schema update failed');
			return updated;
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	async delete(slug: string): Promise<void> {
		const schema = await this.findOne(slug);

		// Block deletion if other schemas have reference fields pointing to this slug
		const referencing = await this.findSchemasReferencingSlug(slug);
		if (referencing.length > 0) {
			const names = referencing.map(s => `"${s.name}" (${s.slug})`).join(', ');
			throw new BadRequestException(
				`Cannot delete "${schema.name}": it is referenced by ${names}. Remove those reference fields first.`
			);
		}

		await this.model.findByIdAndDelete(schema._id).exec();
		await this.entryModel.deleteMany({ schemaSlug: slug }).exec();
	}
}
