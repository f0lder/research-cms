import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { FieldValue } from '@research-cms/shared-types';

export type ContentVersionDocument = HydratedDocument<ContentVersionModel>;

@Schema({ timestamps: true })
export class ContentVersionModel {
	@Prop({ required: true, index: true })
	entryId!: string;

	@Prop({ required: true, index: true })
	schemaSlug!: string;

	@Prop({ type: Object, required: true })
	data!: Record<string, FieldValue>;

	@Prop({ required: true })
	version!: number;

	@Prop()
	createdBy?: string; // admin user id if you have auth

	createdAt?: Date;
	updatedAt?: Date;
}

export const ContentVersionSchema = SchemaFactory.createForClass(ContentVersionModel);

// Index for efficient version retrieval: find all versions for an entry, sorted by version descending
ContentVersionSchema.index({ entryId: 1, version: -1 });
