import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SettingDocument = HydratedDocument<Setting>;

@Schema({ timestamps: true })
export class Setting {
  @Prop({ required: true })
  scope: string;

  @Prop({ required: false })
  scopeId?: string;

  @Prop({ required: false })
  schemaView?: string;

  @Prop({ required: true })
  key: string;

  @Prop({ type: Object })
  value: unknown;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);

// Unique per (scope, scopeId, schemaView, key) — one stored value per combination
SettingSchema.index(
  { scope: 1, scopeId: 1, schemaView: 1, key: 1 },
  { unique: true },
);
