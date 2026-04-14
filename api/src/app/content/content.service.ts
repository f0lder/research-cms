import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { format } from 'fast-csv';
import { ContentEntryModel, ContentEntryDocument } from './schemas/content-entry.schema';
import { ContentVersionModel, ContentVersionDocument } from './schemas/content-version.schema';
import { SchemaService } from '../schema/schema.service';
import { FieldValue, MEDIA_SCHEMA_SLUG } from '@research-cms/shared-types';
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
		@InjectModel(ContentVersionModel.name) private versionModel: Model<ContentVersionDocument>,
		private readonly schemaService: SchemaService,
		private readonly logsService: LogsService,
		private readonly eventEmitter: EventEmitter2,
	) {}

	// ─── Query Helpers (normalize common patterns) ────────────────────────────────

	private getActiveQuery(schemaSlug: string) {
		return { schemaSlug, deletedAt: null };
	}

	private getTrashQuery(schemaSlug: string) {
		return { schemaSlug, deletedAt: { $exists: true, $ne: null } };
	}

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
		const allowed = new Set([
			...resolvedSchema.fields.map(f => f.name),
			'status',
			'publishAt',
			'unpublishAt',
			'deletedAt',
			'version',
		]);
		for (const key of Object.keys(data)) {
			if (!allowed.has(key)) errors.push(`Unknown field: "${key}"`);
		}

		// Validate scheduled publishing: if status is 'scheduled', publishAt must be set
		if (data.status === 'scheduled' && !data.publishAt) {
			errors.push('"publishAt" is required when status is "scheduled"');
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

			switch (field.type) {
				case 'number':
					if (typeof value !== 'number' && isNaN(Number(value))) {
						errors.push(`"${field.label || field.name}" must be a number`);
					}
					break;
				case 'boolean':
					if (typeof value !== 'boolean') {
						errors.push(`"${field.label || field.name}" must be a boolean`);
					}
					break;
				case 'date':
				case 'datetime':
					if (isNaN(Date.parse(String(value)))) {
						errors.push(`"${field.label || field.name}" must be a valid date`);
					}
					break;
				case 'email':
					if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
						errors.push(`"${field.label || field.name}" must be a valid email`);
					}
					break;
				case 'url':
					try { new URL(String(value)); } catch {
						errors.push(`"${field.label || field.name}" must be a valid URL`);
					}
					break;
				case 'select': {
					const opts = (field.config?.type === 'select' ? field.config.options : []) as string[];
					if (opts.length > 0 && !opts.includes(String(value))) {
						errors.push(`"${field.label || field.name}" must be one of: ${opts.join(', ')}`);
					}
					break;
				}
				case 'tags':
					if (!Array.isArray(value)) {
						errors.push(`"${field.label || field.name}" must be an array of strings`);
					} else if (value.length > 0 && !value.every(v => typeof v === 'string')) {
						errors.push(`"${field.label || field.name}" array items must all be strings`);
					}
					break;
				case 'media':
				case 'reference': {
					if (typeof value !== 'string' || !isValidObjectId(value)) {
						errors.push(`"${field.label || field.name}" must be a valid entry ID`);
					} else {
						const targetSlug = field.type === 'media'
							? MEDIA_SCHEMA_SLUG
							: (field.config?.type === 'reference' ? field.config.targetSlug : schemaSlug);
						const label = field.label || field.name;
						const refId = value as string;
						// Queue the existence check — resolved below in parallel
					// Use chainable API to avoid Mongoose generic filter typing issues
					referenceChecks.push(
						this.model.findOne()
							.where('_id').equals(refId)
							.where('schemaSlug').equals(targetSlug)
							.select('_id').lean().exec().then(doc => {
								if (!doc) errors.push(`"${label}" references an entry that does not exist`);
							})
						);
					}
					break;
				}
				case 'references': {
					if (!Array.isArray(value) || value.some(v => !isValidObjectId(v))) {
						errors.push(`"${field.label || field.name}" must be an array of valid entry IDs`);
					} else if (value.length > 0) {
						const targetSlug = field.config?.type === 'references' ? field.config.targetSlug : schemaSlug;
						const label = field.label || field.name;
						const validIds = value as string[];
					// Use chainable API to avoid Mongoose generic filter typing issues
					referenceChecks.push(
						this.model.find()
							.where('schemaSlug').equals(targetSlug)
							.where('_id').in(validIds)
							.select('_id').lean().exec().then(docs => {
								if (docs.length !== validIds.length) errors.push(`"${label}" contains one or more entries that do not exist`);
							})
						);
					}
					break;
				}
				case 'blocks':
					if (!Array.isArray(value)) {
						errors.push(`"${field.label || field.name}" must be an array of blocks`);
					} else if (value.length > 0) {
						// Basic block validation: each item should have a type property
						if (!value.every((v: any) => typeof v === 'object' && v !== null && typeof v.type === 'string')) {
							errors.push(`"${field.label || field.name}" array items must all be valid blocks with a type property`);
						}
					}
					break;
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
		const query = this.getActiveQuery(schemaSlug);
		const [items, total] = await Promise.all([
			this.model.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
			this.model.countDocuments(query),
		]);
		return { items, total, page, limit };
	}

	async findOne(schemaSlug: string, id: string): Promise<ContentEntryDocument> {
		if (!isValidObjectId(id)) {
			throw new BadRequestException(`Invalid entry ID: "${id}"`);
		}
		const entry = await this.model.findOne({ ...this.getActiveQuery(schemaSlug), _id: id }).exec();
		if (!entry) {
			throw new NotFoundException(`Entry "${id}" not found in schema "${schemaSlug}"`);
		}
		return entry;
	}

	async create(schemaSlug: string, data: Record<string, FieldValue>): Promise<ContentEntryDocument> {
		await this.validateData(schemaSlug, data, false);
		
		// Extract system fields (top-level) from input data
		const systemFields = ['status', 'publishAt', 'unpublishAt', 'deletedAt', 'version'];
		const fieldData: Record<string, FieldValue> = {};
		const createFields: Record<string, FieldValue | Date | null | string> = { schemaSlug };
		
		for (const key in data) {
			if (systemFields.includes(key)) {
				createFields[key] = data[key];
			} else {
				fieldData[key] = data[key];
			}
		}
		
		// Determine initial status: if publishAt is in future, status should be 'scheduled'
		const publishAt = createFields.publishAt ? new Date(String(createFields.publishAt)) : null;
		if (publishAt && publishAt > new Date()) {
			createFields.status = 'scheduled';
		} else if (!createFields.status) {
			createFields.status = 'draft';
		}
		
		createFields.data = fieldData;
		const entry = await this.model.create(createFields);
		
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
		
		// Save current state as a version before overwriting
		const currentVersion = entry.version ?? 1;
		await this.versionModel.create({
			entryId: String(entry._id),
			schemaSlug,
			data: entry.data,
			version: currentVersion,
		});
		
		// Extract system fields (top-level) from input data
		const systemFields = ['status', 'publishAt', 'unpublishAt', 'deletedAt', 'version'];
		const fieldData: Record<string, FieldValue> = {};
		const updateFields: Record<string, FieldValue | Date | null> = {};
		
		for (const key in data) {
			if (systemFields.includes(key)) {
				updateFields[key] = data[key];
			} else {
				fieldData[key] = data[key];
			}
		}
		
		const previousData = { ...entry.data } as Record<string, unknown>;
		
		// Build update object: merge schema fields into data object, set system fields at top-level
		// Also increment version number
		const updateObject = {
			$set: { data: { ...entry.data, ...fieldData } },
			$inc: { version: 1 }
		};
		if (Object.keys(updateFields).length > 0) {
			Object.assign(updateObject.$set, updateFields);
		}
		
		const updated = await this.model.findByIdAndUpdate(
			entry._id,
			updateObject,
			{ returnDocument: 'after' },
		).exec();
		
		if (!updated) {
			throw new NotFoundException(`Entry "${id}" not found`);
		}
		
		void this.logsService.log(`Entry updated in "${schemaSlug}"`, ['content', 'update'], { schemaSlug, id });
		this.eventEmitter.emit(
			CmsEvents.CONTENT_UPDATED,
			new ContentUpdatedEvent(schemaSlug, id, previousData, updated.data as Record<string, unknown>),
		);
		return updated;
	}

	async delete(schemaSlug: string, id: string): Promise<void> {
		const entry = await this.findOne(schemaSlug, id);
		// Soft delete — mark as deleted instead of removing
		await this.model.findByIdAndUpdate(entry._id, { $set: { deletedAt: new Date() } }).exec();
		void this.logsService.log(`Entry moved to trash in "${schemaSlug}"`, ['content', 'delete'], { schemaSlug, id });
		this.eventEmitter.emit(CmsEvents.CONTENT_DELETED, new ContentDeletedEvent(schemaSlug, id));
	}

	// ─── Advanced Operations ─────────────────────────────────────────────────────

	/** Permanently remove a soft-deleted entry */
	async permanentlyDelete(schemaSlug: string, id: string): Promise<void> {
		if (!isValidObjectId(id)) throw new BadRequestException('Invalid entry ID');
		await this.schemaService.findOne(schemaSlug);
		const deleted = await this.model.findByIdAndDelete(id).exec();
		if (!deleted) throw new NotFoundException('Entry not found');
		void this.logsService.log(`Entry permanently deleted from "${schemaSlug}"`, ['content', 'delete'], { schemaSlug, id });
	}

	/** Restore a soft-deleted entry from trash */
	async restore(schemaSlug: string, id: string): Promise<ContentEntryDocument> {
		if (!isValidObjectId(id)) throw new BadRequestException('Invalid entry ID');
		await this.schemaService.findOne(schemaSlug);
		const restored = await this.model.findByIdAndUpdate(
			id,
			{ $set: { deletedAt: null } },
			{ new: true }
		).exec();
		if (!restored) throw new NotFoundException('Entry not found');
		if (restored.schemaSlug !== schemaSlug) {
			throw new NotFoundException('Entry not found in this schema');
		}
		void this.logsService.log(`Entry restored in "${schemaSlug}"`, ['content', 'restore'], { schemaSlug, id });
		return restored;
	}

	/** Duplicate an entry as a new draft */
	async duplicate(schemaSlug: string, id: string): Promise<ContentEntryDocument> {
		const entry = await this.findOne(schemaSlug, id);
		const duplicated = await this.model.create({
			schemaSlug,
			data: { ...entry.data },
			status: 'draft',
			version: 1,
		});
		void this.logsService.log(`Entry duplicated in "${schemaSlug}"`, ['content', 'create'], { schemaSlug, originalId: id, newId: duplicated._id });
		this.eventEmitter.emit(CmsEvents.CONTENT_CREATED, new ContentCreatedEvent(schemaSlug, duplicated._id.toString(), duplicated.data, 'admin'));
		return duplicated;
	}

	/** Update status for multiple entries with validation */
	async bulkUpdateStatus(schemaSlug: string, ids: string[], status: string): Promise<{ modifiedCount: number }> {
		await this.schemaService.findOne(schemaSlug);
		
		// Validate status value
		const validStatuses = ['draft', 'published', 'scheduled', 'archived'];
		if (!validStatuses.includes(status)) {
			throw new BadRequestException(`Status must be one of: ${validStatuses.join(', ')}`);
		}
		
		const validIds = ids.filter(id => isValidObjectId(id));
		if (validIds.length === 0) throw new BadRequestException('No valid entry IDs provided');
		
		const result = await this.model.updateMany(
			{ ...this.getActiveQuery(schemaSlug), _id: { $in: validIds } },
			{ $set: { status } }
		).exec();
		
		void this.logsService.log(`Bulk status update in "${schemaSlug}"`, ['content', 'update'], { schemaSlug, count: result.modifiedCount, status });
		return { modifiedCount: result.modifiedCount };
	}

	/** Bulk soft delete (move to trash) */
	async bulkDelete(schemaSlug: string, ids: string[]): Promise<{ modifiedCount: number }> {
		await this.schemaService.findOne(schemaSlug);
		
		const validIds = ids.filter(id => isValidObjectId(id));
		if (validIds.length === 0) throw new BadRequestException('No valid entry IDs provided');
		
		const result = await this.model.updateMany(
			{ ...this.getActiveQuery(schemaSlug), _id: { $in: validIds } },
			{ $set: { deletedAt: new Date() } }
		).exec();
		
		void this.logsService.log(`Bulk delete in "${schemaSlug}"`, ['content', 'delete'], { schemaSlug, ids: validIds, count: result.modifiedCount });
		return { modifiedCount: result.modifiedCount };
	}

	/** Rebuild text indices for a schema's entries */
	async rebuildIndex(schemaSlug: string): Promise<{ message: string; docsCount: number }> {
		await this.schemaService.findOne(schemaSlug);
		
		// Count documents before rebuilding
		const docsCount = await this.model.countDocuments({ schemaSlug });
		
		// Rebuild all indices on the model
		await this.model.syncIndexes();
		
		void this.logsService.log(`Text indices rebuilt for "${schemaSlug}" (${docsCount} documents indexed)`, ['content', 'maintenance'], { schemaSlug, docsCount });
		return { message: `Rebuilt indices for ${docsCount} documents`, docsCount };
	}

	/** Search entries using MongoDB full-text search with pagination */
	async search(
		schemaSlug: string,
		query: string,
		page = 1,
		limit = 20,
	): Promise<{
		items: ContentEntryDocument[];
		total: number;
		page: number;
		limit: number;
	}> {
		if (!query || query.trim().length === 0) {
			return { items: [], total: 0, page, limit };
		}
		
		const searchQuery = {
			...this.getActiveQuery(schemaSlug),
			$text: { $search: query },
		};
		
		const [items, total] = await Promise.all([
			this.model
				.find(searchQuery, { score: { $meta: 'textScore' } })
				.sort({ score: { $meta: 'textScore' } })
				.skip((page - 1) * limit)
				.limit(limit)
				.exec(),
			this.model.countDocuments(searchQuery),
		]);
		
		return { items, total, page, limit };
	}

	/** Get soft-deleted entries (trash) */
	async findTrash(schemaSlug: string, page = 1, limit = 50): Promise<{
		items: ContentEntryDocument[];
		total: number;
		page: number;
		limit: number;
	}> {
		await this.schemaService.findOne(schemaSlug);
		const query = this.getTrashQuery(schemaSlug);
		const [items, total] = await Promise.all([
			this.model.find(query).sort({ deletedAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
			this.model.countDocuments(query),
		]);
		return { items, total, page, limit };
	}

	// ─── Version History ─────────────────────────────────────────────────────

	/** Get version history for an entry, sorted newest first */
	async getVersions(schemaSlug: string, id: string) {
		if (!isValidObjectId(id)) {
			throw new BadRequestException(`Invalid entry ID: "${id}"`);
		}
		// Verify entry exists
		await this.findOne(schemaSlug, id);
		
		return this.versionModel
			.find({ entryId: id, schemaSlug })
			.sort({ version: -1 })
			.lean()
			.exec();
	}

	/** Restore an entry to a specific version */
	async restoreVersion(
		schemaSlug: string,
		id: string,
		version: number
	): Promise<ContentEntryDocument> {
		if (!isValidObjectId(id)) {
			throw new BadRequestException(`Invalid entry ID: "${id}"`);
		}
		
		// Find the version to restore
		const versionDoc = await this.versionModel
			.findOne({ entryId: id, schemaSlug, version })
			.exec();
		
		if (!versionDoc) {
			throw new NotFoundException(`Version ${version} not found for entry "${id}"`);
		}
		
		// Get current entry to verify it exists
		const entry = await this.findOne(schemaSlug, id);
		
		// Save current state as a version before restoring
		const currentVersion = entry.version ?? 1;
		await this.versionModel.create({
			entryId: id,
			schemaSlug,
			data: entry.data,
			version: currentVersion,
		});
		
		// Restore to the target version data, increment version
		const restored = await this.model.findByIdAndUpdate(
			id,
			{
				$set: { data: versionDoc.data },
				$inc: { version: 1 }
			},
			{ returnDocument: 'after' }
		).exec();
		
		if (!restored) {
			throw new NotFoundException(`Entry "${id}" not found`);
		}
		
		void this.logsService.log(
			`Entry restored to version ${version} in "${schemaSlug}"`,
			['content', 'restore-version'],
			{ schemaSlug, id, version }
		);
		
		this.eventEmitter.emit(
			CmsEvents.CONTENT_UPDATED,
			new ContentUpdatedEvent(
				schemaSlug,
				id,
				versionDoc.data as Record<string, unknown>,
				restored.data as Record<string, unknown>
			),
		);
		
		return restored;
	}

	/** Export entries to CSV */
	async exportCsv(schemaSlug: string): Promise<string> {
		const schema = await this.schemaService.findOne(schemaSlug);
		const entries = await this.model
			.find({ schemaSlug, deletedAt: null })
			.sort({ createdAt: -1 })
			.lean()
			.exec();

		if (!entries.length) return '';

		// Build headers from schema fields + system fields
		const fieldNames = schema.fields.map(f => f.name);
		const headers = ['_id', 'status', 'createdAt', 'updatedAt', ...fieldNames];

		const rows = entries.map(entry => {
			const row: Record<string, unknown> = {
				_id: String(entry._id),
				status: entry.status,
				createdAt: entry.createdAt?.toISOString() ?? '',
				updatedAt: entry.updatedAt?.toISOString() ?? '',
			};
			for (const field of fieldNames) {
				const value = entry.data[field];
				// Flatten arrays to semicolon-separated
				row[field] = Array.isArray(value) ? value.join(';') : value ?? '';
			}
			return row;
		});

		return new Promise((resolve, reject) => {
			const chunks: string[] = [];
			const stream = format({ headers: true });
			stream.on('data', chunk => chunks.push(chunk.toString()));
			stream.on('end', () => resolve(chunks.join('')));
			stream.on('error', reject);
			rows.forEach(row => stream.write(row));
			stream.end();
		});
	}
}
