import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContentType, ContentTypeDocument } from './schemas/content-type.schema';
import { ContentTypeDefinition } from '@research-cms/shared-types';

@Injectable()
export class SchemaService {
	constructor(
		@InjectModel(ContentType.name) private model: Model<ContentTypeDocument>
	) { }

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

		try {
			return await this.model.findByIdAndUpdate(
				schema._id,
				{ $set: data },
				{ returnDocument: 'after' }
			).exec();
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	async delete(slug: string): Promise<void> {
		const schema = await this.findOne(slug);
		await this.model.findByIdAndDelete(schema._id).exec();
	}
}