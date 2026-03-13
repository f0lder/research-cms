import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { ContentEntryModel, ContentEntryDocument } from './schemas/content-entry.schema';
import { SchemaService } from '../schema/schema.service';
import { FieldType, FieldValue } from '@research-cms/shared-types';

@Injectable()
export class ContentService {
	constructor(
		@InjectModel(ContentEntryModel.name) private model: Model<ContentEntryDocument>,
		private readonly schemaService: SchemaService
	) {}

	// ─── Validation ────────────────────────────────────────────────────────────

	private async validateData(
		schemaSlug: string,
		data: Record<string, FieldValue>,
		partial = false
	): Promise<void> {
		const schema = await this.schemaService.findOne(schemaSlug);
		const errors: string[] = [];

		// Reject fields not defined in the schema
		const allowed = new Set(schema.fields.map(f => f.name));
		for (const key of Object.keys(data)) {
			if (!allowed.has(key)) {
				errors.push(`Unknown field: "${key}"`);
			}
		}

		for (const field of schema.fields) {
			const value = data[field.name];
			const missing = value === undefined || value === null || value === '';

			// Required check (skip on partial updates when field is not present at all)
			if (field.required && !partial && missing) {
				errors.push(`"${field.label || field.name}" is required`);
				continue;
			}

			if (missing) continue;

			// Type checks
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
				case FieldType.IMAGE:
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
				case FieldType.REFERENCE:
					if (typeof value !== 'string' || !isValidObjectId(value)) {
						errors.push(`"${field.label || field.name}" must be a valid entry ID`);
					}
					break;
				case FieldType.REFERENCES:
					if (!Array.isArray(value) || value.some(v => !isValidObjectId(v))) {
						errors.push(`"${field.label || field.name}" must be an array of valid entry IDs`);
					}
					break;
			}
		}

		if (errors.length > 0) {
			throw new BadRequestException(errors);
		}
	}

	// ─── CRUD ────────────────────────────────────────────────────────────────

	async findAll(schemaSlug: string): Promise<ContentEntryDocument[]> {
		// Verify schema exists first
		await this.schemaService.findOne(schemaSlug);
		return this.model.find({ schemaSlug }).sort({ createdAt: -1 }).exec();
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
		return this.model.create({ schemaSlug, data });
	}

	async update(
		schemaSlug: string,
		id: string,
		data: Record<string, FieldValue>
	): Promise<ContentEntryDocument> {
		const entry = await this.findOne(schemaSlug, id);
		await this.validateData(schemaSlug, data, true);
		return this.model.findByIdAndUpdate(
			entry._id,
			{ $set: { data: { ...entry.data, ...data } } },
			{ returnDocument: 'after' }
		).exec();
	}

	async delete(schemaSlug: string, id: string): Promise<void> {
		const entry = await this.findOne(schemaSlug, id);
		await this.model.findByIdAndDelete(entry._id).exec();
	}
}
