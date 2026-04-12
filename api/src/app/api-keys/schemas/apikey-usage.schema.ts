import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ApiKeyUsageDocument = HydratedDocument<ApiKeyUsageModel>;

@Schema()
export class ApiKeyUsageModel {
  @Prop({ required: true })
  keyId: string;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD

  /** Unique IP addresses that accessed this key on this day. */
  @Prop({ type: [String], default: [] })
  users: string[];

  /** Quick denormalized count of unique users. */
  @Prop({ default: 0 })
  userCount: number;

  /** Breakdown of unique users per schema slug. */
  @Prop({ type: Object, default: {} })
  schemas: Record<string, number>;
}

export const ApiKeyUsageSchema = SchemaFactory.createForClass(ApiKeyUsageModel);

// Compound unique index — one document per key per day
ApiKeyUsageSchema.index({ keyId: 1, date: 1 }, { unique: true });
