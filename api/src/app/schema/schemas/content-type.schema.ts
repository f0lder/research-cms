import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ContentTypeDefinition, FieldDefinition } from '@research-cms/shared-types';

export type ContentTypeDocument = HydratedDocument<ContentType>;

@Schema({ timestamps: true })
export class ContentType implements ContentTypeDefinition {
	@Prop({ required: true })
	name: string;

	@Prop({ required: true, unique: true })
	slug: string;

	@Prop()
	singularName?: string;

	@Prop()
	pluralName?: string;

	@Prop()
	description?: string;
	
	@Prop({ type: [Object], required: true })
	fields: FieldDefinition[];

	@Prop({ type: Object, default: {} })
	features?: { drafts?: boolean; revisions?: boolean; search?: boolean; seo?: boolean };

	@Prop({ default: false })
	system: boolean;
}

export const ContentTypeSchema = SchemaFactory.createForClass(ContentType);