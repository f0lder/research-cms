import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { FieldValue } from '@research-cms/shared-types';

export type ContentEntryDocument = HydratedDocument<ContentEntryModel>;

@Schema({ timestamps: true })
export class ContentEntryModel {
	@Prop({ required: true, index: true })
	schemaSlug!: string;

	@Prop({ type: Object, required: true })
	data!: Record<string, FieldValue>;

	@Prop({ default: 'draft', index: true })
	status?: 'draft' | 'published' | 'scheduled' | 'archived';

	@Prop({ index: true, sparse: true })
	deletedAt?: Date;

	@Prop({ index: true, sparse: true })
	publishAt?: Date;

	@Prop({ default: 1 })
	version?: number;

	createdAt?: Date;
	updatedAt?: Date;
}

export const ContentEntrySchema = SchemaFactory.createForClass(ContentEntryModel);

// Add text index for full-text search across all data fields
ContentEntrySchema.index({ 'data': 'text' });
