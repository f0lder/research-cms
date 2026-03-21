import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiKey } from '@research-cms/shared-types';

export type ApiKeyDocument = HydratedDocument<ApiKeyModel>;

@Schema({ timestamps: true })
export class ApiKeyModel implements Omit<ApiKey, '_id' | 'createdAt'> {
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
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKeyModel);
