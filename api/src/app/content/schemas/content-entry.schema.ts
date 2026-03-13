import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ContentEntry, FieldValue } from '@research-cms/shared-types';

export type ContentEntryDocument = HydratedDocument<ContentEntryModel>;

@Schema({ timestamps: true })
export class ContentEntryModel implements Omit<ContentEntry, '_id' | 'createdAt' | 'updatedAt'> {
	@Prop({ required: true, index: true })
	schemaSlug: string;

	@Prop({ type: Object, required: true })
	data: Record<string, FieldValue>;
}

export const ContentEntrySchema = SchemaFactory.createForClass(ContentEntryModel);
