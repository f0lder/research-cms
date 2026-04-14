import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Client, LayoutBlock } from '@research-cms/shared-types';

export type ApiKeyDocument = HydratedDocument<ApiKeyModel>;

@Schema({ timestamps: true })
export class ApiKeyModel implements Omit<Client, '_id' | 'createdAt'> {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ default: 0 })
  hits: number;

  @Prop({ default: null })
  lastUsedAt: string | null;

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: [String], default: [] })
  allowedSchemas: string[];

  @Prop({
    type: [
      {
        schemaSlug: { type: String, required: true },
        blocks: { type: [Object], default: [] },
      },
    ],
    default: [],
  })
  layouts: { schemaSlug: string; blocks: LayoutBlock[] }[];

  @Prop({ type: String, default: null })
  homePage: string | null;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKeyModel);
