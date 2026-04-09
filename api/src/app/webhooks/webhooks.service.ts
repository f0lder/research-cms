import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { Model } from 'mongoose';
import { createHmac } from 'crypto';
import { WebhookModel, WebhookDocument } from './schemas/webhook.schema';
import {
  CmsEvents,
  ContentCreatedEvent,
  ContentUpdatedEvent,
  ContentDeletedEvent,
  SchemaCreatedEvent,
  SchemaUpdatedEvent,
  SchemaDeletedEvent,
  MediaUploadedEvent,
  MediaDeletedEvent,
  CmsEventName,
} from '../events';

type AnyEvent =
  | ContentCreatedEvent | ContentUpdatedEvent | ContentDeletedEvent
  | SchemaCreatedEvent  | SchemaUpdatedEvent  | SchemaDeletedEvent
  | MediaUploadedEvent  | MediaDeletedEvent;

export interface WebhookData {
  name: string;
  url: string;
  events?: string[];
  schemas?: string[];
  active?: boolean;
  secret?: string | null;
}

@Injectable()
export class WebhooksService {
  constructor(
    @InjectModel(WebhookModel.name) private model: Model<WebhookDocument>,
  ) {}

  // ── Event listeners ────────────────────────────────────────────────────────

  @OnEvent('content.*')
  handleContentEvent(event: ContentCreatedEvent | ContentUpdatedEvent | ContentDeletedEvent) {
    void this.dispatch(this.resolveEventName(event), event);
  }

  @OnEvent('schema.*')
  handleSchemaEvent(event: SchemaCreatedEvent | SchemaUpdatedEvent | SchemaDeletedEvent) {
    void this.dispatch(this.resolveEventName(event), event);
  }

  @OnEvent('media.*')
  handleMediaEvent(event: MediaUploadedEvent | MediaDeletedEvent) {
    void this.dispatch(this.resolveEventName(event), event);
  }

  // ── Dispatch ───────────────────────────────────────────────────────────────

  private async dispatch(eventName: string, payload: AnyEvent): Promise<void> {
    const webhooks = await this.model.find({ active: true }).lean().exec();

    for (const webhook of webhooks) {
      // Filter by event type (empty = all)
      if (webhook.events.length > 0 && !webhook.events.includes(eventName)) continue;

      // Filter by schema slug for content events (empty = all)
      if (
        webhook.schemas.length > 0 &&
        (payload instanceof ContentCreatedEvent ||
         payload instanceof ContentUpdatedEvent ||
         payload instanceof ContentDeletedEvent) &&
        !webhook.schemas.includes(payload.schemaSlug)
      ) continue;

      // Non-blocking — failures are logged on the webhook document
      this.fireWithRetry(webhook._id.toString(), webhook.url, webhook.secret, eventName, payload).catch(() => {
        // Already handled inside fireWithRetry
      });
    }
  }

  private async fireWithRetry(
    webhookId: string,
    url: string,
    secret: string | null,
    eventName: string,
    payload: AnyEvent,
    attempt = 1,
  ): Promise<void> {
    const body = { event: eventName, timestamp: new Date().toISOString(), payload };
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (secret) {
      headers['x-cms-signature'] = createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex');
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      await this.model.findByIdAndUpdate(webhookId, {
        $inc: { successCount: 1 },
        $set: { lastTriggeredAt: new Date(), lastError: null },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      if (attempt < 3) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        return this.fireWithRetry(webhookId, url, secret, eventName, payload, attempt + 1);
      }

      await this.model.findByIdAndUpdate(webhookId, {
        $inc: { failureCount: 1 },
        $set: { lastTriggeredAt: new Date(), lastError: message },
      });
    }
  }

  private resolveEventName(event: AnyEvent): CmsEventName {
    if (event instanceof ContentCreatedEvent) return CmsEvents.CONTENT_CREATED;
    if (event instanceof ContentUpdatedEvent) return CmsEvents.CONTENT_UPDATED;
    if (event instanceof ContentDeletedEvent) return CmsEvents.CONTENT_DELETED;
    if (event instanceof SchemaCreatedEvent)  return CmsEvents.SCHEMA_CREATED;
    if (event instanceof SchemaUpdatedEvent)  return CmsEvents.SCHEMA_UPDATED;
    if (event instanceof SchemaDeletedEvent)  return CmsEvents.SCHEMA_DELETED;
    if (event instanceof MediaUploadedEvent)  return CmsEvents.MEDIA_UPLOADED;
    return CmsEvents.MEDIA_DELETED;
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async findAll(): Promise<WebhookDocument[]> {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<WebhookDocument> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new Error('Webhook not found');
    return doc;
  }

  async create(data: WebhookData): Promise<WebhookDocument> {
    return this.model.create({
      name: data.name,
      url: data.url,
      events: data.events ?? [],
      schemas: data.schemas ?? [],
      active: data.active ?? true,
      secret: data.secret ?? null,
    });
  }

  async update(id: string, data: Partial<WebhookData>): Promise<WebhookDocument> {
    const doc = await this.model.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' }).exec();
    if (!doc) throw new Error('Webhook not found');
    return doc;
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }
}
