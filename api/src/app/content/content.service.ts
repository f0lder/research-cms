import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContentEntryModel, ContentEntryDocument } from './schemas/content-entry.schema';
import { SchemaService } from '../schema/schema.service';
import { FieldType, FieldValue, MEDIA_SCHEMA_SLUG } from '@research-cms/shared-types';
import { LogsService } from '../logs/logs.service';
import {
  CmsEvents,
  ContentCreatedEvent,
  ContentUpdatedEvent,
  ContentDeletedEvent,
} from '../events';

@Injectable()
export class ContentService {
	constructor(
		@InjectModel(ContentEntryModel.name) private model: Model<ContentEntryDocument>,
		private readonly schemaService: SchemaService,
		private readonly logsService: LogsService,
		private readonly eventEmitter: EventEmitter2,
	) {}

	// ─── Validation ────────────────────────────────────────────────────────────

	/**
	 * Validates entry data against its schema.
	 * @param partial - When true, missing required fields are allowed (partial update).
	 */
	private async validateData(
		schemaSlug: string,
		data: Record<string, FieldValue>,
		partial = false,
	): Promise<void> {
		const resolvedSchema = await this.schemaService.findOne(schemaSlug);
		const errors: string[] = [];

		// Reject fields not defined in the schema
		const allowed = new Set(resolvedSchema.fields.map(f => f.name));
		for (const key of Object.keys(data)) {
			if (!allowed.has(key)) errors.push(`Unknown field: "${key}"`);
		}

		// Collect reference existence checks so they run in parallel instead of sequentially
		const referenceChecks: Promise<void>[] = [];

		for (const field of resolvedSchema.fields) {
			const value = data[field.name];
			const missing = value === undefined || value === null || value === '';

			// Required check (skip on partial updates when field is not present)
			if (field.required && !partial && missing) {
				errors.push(`"${field.label || field.name}" is required`);
				continue;
			}

			if (missing) continue;

			switch (field.type as FieldType) {
				case FieldType.NUMBER:
					if (typeof value !== 'number' && isNaN(Number(value))) {
						errors.push(`"${field.label || field.name}" must be a number`);
					}
					break;
				case FieldType.BOOLEAN:
					if (typeof value !== 'boolean') {
						errors.push(`"${field.label || field.name}" must be a boolean`);
					}
					break;
				case FieldType.DATE:
				case FieldType.DATETIME:
					if (isNaN(Date.parse(String(value)))) {
						errors.push(`"${field.label || field.name}" must be a valid date`);
					}
					break;
				case FieldType.EMAIL:
					if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
						errors.push(`"${field.label || field.name}" must be a valid email`);
					}
					break;
				case FieldType.URL:
					try { new URL(String(value)); } catch {
						errors.push(`"${field.label || field.name}" must be a valid URL`);
					}
					break;
				case FieldType.SELECT: {
					const opts = field.config?.type === 'select' ? field.config.options : [];
					if (opts.length > 0 && !opts.includes(String(value))) {
						errors.push(`"${field.label || field.name}" must be one of: ${opts.join(', ')}`);
					}
					break;
				}
				case FieldType.TAGS:
					if (!Array.isArray(value)) {
						errors.push(`"${field.label || field.name}" must be an array of strings`);
					}
					break;
				case FieldType.MEDIA:
				case FieldType.REFERENCE: {
					if (typeof value !== 'string' || !isValidObjectId(value)) {
						errors.push(`"${field.label || field.name}" must be a valid entry ID`);
					} else {
						const targetSlug = field.type === FieldType.MEDIA
							? MEDIA_SCHEMA_SLUG
							: (field.config?.type === 'reference' ? field.config.targetSlug : schemaSlug);
						const label = field.label || field.name;
						// Queue the existence check — resolved below in parallel
						referenceChecks.push(
							this.model.exists({ _id: value, schemaSlug: targetSlug }).then(exists => {
								if (!exists) errors.push(`"${label}" references an entry that does not exist`);
							})
						);
					}
					break;
				}
				case FieldType.REFERENCES: {
					if (!Array.isArray(value) || value.some(v => !isValidObjectId(v))) {
						errors.push(`"${field.label || field.name}" must be an array of valid entry IDs`);
					} else if (value.length > 0) {
						const targetSlug = field.config?.type === 'references' ? field.config.targetSlug : schemaSlug;
						const label = field.label || field.name;
						referenceChecks.push(
							this.model.countDocuments({ _id: { $in: value }, schemaSlug: targetSlug }).then(found => {
								if (found !== value.length) errors.push(`"${label}" contains one or more entries that do not exist`);
							})
						);
					}
					break;
				}
			}
		}

		// Run all reference existence checks in parallel
		await Promise.all(referenceChecks);

		if (errors.length > 0) {
			throw new BadRequestException(errors);
		}
	}

	// ─── CRUD ────────────────────────────────────────────────────────────────

	async findAll(schemaSlug: string, page = 1, limit = 50): Promise<{
		items: ContentEntryDocument[];
		total: number;
		page: number;
		limit: number;
	}> {
		await this.schemaService.findOne(schemaSlug);
		const [items, total] = await Promise.all([
			this.model.find({ schemaSlug }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
			this.model.countDocuments({ schemaSlug }),
		]);
		return { items, total, page, limit };
	}

	async findOne(schemaSlug: string, id: string): Promise<ContentEntryDocument> {
		if (!isValidObjectId(id)) {
			throw new BadRequestException(`Invalid entry ID: "${id}"`);
		}
		const entry = await this.model.findOne({ _id: id, schemaSlug }).exec();
		if (!entry) {
			throw new NotFoundException(`Entry "${id}" not found in schema "${schemaSlug}"`);
		}
		return entry;
	}

	async create(schemaSlug: string, data: Record<string, FieldValue>): Promise<ContentEntryDocument> {
		await this.validateData(schemaSlug, data, false);
		const entry = await this.model.create({ schemaSlug, data });
		void this.logsService.log(`Entry created in "${schemaSlug}"`, ['content', 'create'], { schemaSlug, id: String(entry._id) });
		this.eventEmitter.emit(
			CmsEvents.CONTENT_CREATED,
			new ContentCreatedEvent(schemaSlug, String(entry._id), entry.data as Record<string, unknown>),
		);
		return entry;
	}

	async update(
		schemaSlug: string,
		id: string,
		data: Record<string, FieldValue>,
	): Promise<ContentEntryDocument> {
		const entry = await this.findOne(schemaSlug, id);
		await this.validateData(schemaSlug, data, true);
		const previousData = { ...entry.data } as Record<string, unknown>;
		const updated = await this.model.findByIdAndUpdate(
			entry._id,
			// Merges only at the top level — other fields are preserved unchanged
			{ $set: { data: { ...entry.data, ...data } } },
			{ returnDocument: 'after' },
		).exec();
		void this.logsService.log(`Entry updated in "${schemaSlug}"`, ['content', 'update'], { schemaSlug, id });
		this.eventEmitter.emit(
			CmsEvents.CONTENT_UPDATED,
			new ContentUpdatedEvent(schemaSlug, id, previousData, updated.data as Record<string, unknown>),
		);
		return updated;
	}

	async delete(schemaSlug: string, id: string): Promise<void> {
		const entry = await this.findOne(schemaSlug, id);
		await this.model.findByIdAndDelete(entry._id).exec();
		void this.logsService.log(`Entry deleted from "${schemaSlug}"`, ['content', 'delete'], { schemaSlug, id });
		this.eventEmitter.emit(CmsEvents.CONTENT_DELETED, new ContentDeletedEvent(schemaSlug, id));
	}
}
