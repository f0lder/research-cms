import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LogEntryDocument = HydratedDocument<LogEntryModel>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class LogEntryModel {
  @Prop({ required: true })
  message: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object, default: null })
  meta: Record<string, unknown> | null;
}

export const LogEntrySchema = SchemaFactory.createForClass(LogEntryModel);

// Index for fast tag filtering
LogEntrySchema.index({ tags: 1 });
LogEntrySchema.index({ createdAt: -1 });
