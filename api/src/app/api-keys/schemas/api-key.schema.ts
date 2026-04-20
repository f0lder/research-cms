import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Client, LayoutBlock } from '@research-cms/shared-types';

export type ApiKeyDocument = HydratedDocument<ApiKeyModel>;

@Schema({ timestamps: true })
export class ApiKeyModel implements Omit<Client, '_id' | 'createdAt' | 'layouts'> {
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
        schemaId: { type: Types.ObjectId, required: true, ref: 'ContentType' },
        blocks: { type: [Object], default: [] },
      },
    ],
    default: [],
  })
  layouts: { schemaId: Types.ObjectId; blocks: LayoutBlock[] }[];

  @Prop({ type: String, default: null })
  homePage: string | null;

  @Prop({ type: String, default: null })
  _lastIpDate: string | null; // Track last IP:date combo to avoid duplicate hits
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKeyModel);
