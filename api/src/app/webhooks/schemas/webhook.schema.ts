import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WebhookDocument = HydratedDocument<WebhookModel>;

@Schema({ timestamps: true })
export class WebhookModel {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  /** Event names to subscribe to — empty array means all events. */
  @Prop({ type: [String], default: [] })
  events: string[];

  /** Schema slugs to filter on — empty array means all schemas. */
  @Prop({ type: [String], default: [] })
  schemas: string[];

  @Prop({ default: true })
  active: boolean;

  /** Optional HMAC secret — used to sign the payload (x-cms-signature header). */
  @Prop({ type: String, default: null })
  secret: string | null;

  @Prop({ default: 0 })
  successCount: number;

  @Prop({ default: 0 })
  failureCount: number;

  @Prop({ type: Date, default: null })
  lastTriggeredAt: Date | null;

  @Prop({ type: String, default: null })
  lastError: string | null;
}

export const WebhookSchema = SchemaFactory.createForClass(WebhookModel);
