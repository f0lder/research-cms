import { Injectable, NotFoundException } from '@nestjs/common';
import { SchemaService } from '../schema/schema.service';
import { LayoutsService } from '../layouts/layouts.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContentEntryModel, ContentEntryDocument } from '../content/schemas/content-entry.schema';
import {
  BlockDefinition,
  FieldType,
  FieldValue,
  MediaEntry,
  PublicBlock,
  PublicEntryResponse,
  MEDIA_SCHEMA_SLUG,
} from '@research-cms/shared-types';

// Status field is a convention: schemas with a draft/publish workflow must include
// a field named "status". Entries with status="published" or no status field at all
// are served publicly. Entries with status="draft" are excluded.
const PUBLISHED_FILTER = {
  $or: [{ 'data.status': 'published' }, { 'data.status': { $exists: false } }],
};

// Reference fields return the raw ObjectId string by design — resolving them would
// require recursive schema lookups and add significant latency. Mobile/web consumers
// can follow up with GET /public/:targetSlug/:id if they need the full document.

@Injectable()
export class PublicService {
  constructor(
    private readonly schemaService: SchemaService,
    private readonly layoutsService: LayoutsService,
    @InjectModel(ContentEntryModel.name) private entryModel: Model<ContentEntryDocument>,
  ) {}

  // ─── Media helpers ────────────────────────────────────────────────────────

  private docToMediaEntry(doc: ContentEntryDocument): MediaEntry {
    return {
      _id: String(doc._id),
      title: String(doc.data.title ?? ''),
      url: String(doc.data.url ?? ''),
      caption: doc.data.caption ? String(doc.data.caption) : undefined,
      altText: doc.data.altText ? String(doc.data.altText) : undefined,
      mimeType: doc.data.mimeType ? String(doc.data.mimeType) : undefined,
      fileSize: doc.data.fileSize ? Number(doc.data.fileSize) : undefined,
    };
  }

  /**
   * Resolves all MEDIA field values in a set of blocks with a single DB query
   * instead of one query per media field per entry.
   */
  private async resolveMediaBatch(
    blocks: BlockDefinition[],
    data: Record<string, unknown>,
    fieldMap: Map<string, { type: FieldType }>,
  ): Promise<Map<string, MediaEntry | null>> {
    const mediaIds = blocks
      .filter(b => fieldMap.get(b.fieldName)?.type === FieldType.MEDIA)
      .map(b => data[b.fieldName])
      .filter((v): v is string => typeof v === 'string');

    if (mediaIds.length === 0) return new Map();

    const docs = await this.entryModel
      .find({ _id: { $in: mediaIds }, schemaSlug: MEDIA_SCHEMA_SLUG })
      .exec();

    return new Map(docs.map(d => [String(d._id), this.docToMediaEntry(d)]));
  }

  // ─── Block resolution ─────────────────────────────────────────────────────

  /**
   * Resolves blocks for a single entry.
   * `savedBlocks` is the layout to use — either the client's custom layout for this
   * schema or the global layout. Null falls back to bootstrapping from the schema.
   */
  private async resolveBlocks(
    schema: { fields: { name: string; label: string; type: FieldType }[] },
    savedBlocks: BlockDefinition[] | null,
    data: Record<string, unknown>,
  ): Promise<PublicBlock[]> {
    const fieldMap = new Map(schema.fields.map(f => [f.name, f]));
    const layoutBlocks = this.layoutsService.syncWithSchema(
      schema as Parameters<typeof this.layoutsService.syncWithSchema>[0],
      savedBlocks,
    );

    const visibleBlocks = layoutBlocks
      .filter(b => b.visible)
      .sort((a, b) => a.order - b.order);

    // Batch-resolve all media IDs in one query
    const mediaMap = await this.resolveMediaBatch(visibleBlocks, data, fieldMap);

    return visibleBlocks.map(b => {
      const field = fieldMap.get(b.fieldName);
      const raw = data[b.fieldName] ?? null;

      if (field?.type === FieldType.MEDIA && typeof raw === 'string') {
        return { ...b, value: mediaMap.get(raw) ?? null };
      }

      return { ...b, value: raw as FieldValue | null };
    });
  }

  // ─── Public API methods ───────────────────────────────────────────────────

  async listSchemas(allowedSchemas: string[] = []): Promise<{ slug: string; name: string }[]> {
    const schemas = await this.schemaService.findAll();
    const all = schemas.map(s => ({ slug: s.slug, name: s.name }));
    if (allowedSchemas.length === 0) return all;
    return all.filter(s => allowedSchemas.includes(s.slug));
  }

  async findAll(
    schemaSlug: string,
    page = 1,
    limit = 50,
    clientLayouts: Map<string, BlockDefinition[]> = new Map(),
  ): Promise<{ items: PublicEntryResponse[]; total: number; page: number; limit: number }> {
    // Fetch schema, layout, and entries in parallel — avoids repeating these
    // lookups per-entry which would cause N+1 queries
    const [schema, savedLayout, entries, total] = await Promise.all([
      this.schemaService.findOne(schemaSlug),
      this.layoutsService.findOne(schemaSlug),
      this.entryModel
        .find({ schemaSlug, ...PUBLISHED_FILTER })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.entryModel.countDocuments({ schemaSlug, ...PUBLISHED_FILTER }),
    ]);

    // Client layout takes precedence over the global layout
    const savedBlocks = clientLayouts.get(schemaSlug) ?? savedLayout?.blocks ?? null;

    const items = await Promise.all(
      entries.map(async e => ({
        _id: String(e._id),
        schemaSlug: e.schemaSlug,
        blocks: await this.resolveBlocks(schema, savedBlocks, e.data as Record<string, unknown>),
        createdAt: e.createdAt?.toISOString?.() ?? undefined,
      }))
    );

    return { items, total, page, limit };
  }

  async findOne(
    schemaSlug: string,
    id: string,
    allowedSchemas: string[] = [],
    clientLayouts: Map<string, BlockDefinition[]> = new Map(),
  ): Promise<PublicEntryResponse> {
    // Enforce API key schema restrictions — return 404 (not 403) to avoid
    // leaking the existence of schemas the key isn't permitted to access
    if (allowedSchemas.length > 0 && !allowedSchemas.includes(schemaSlug)) {
      throw new NotFoundException('Entry not found');
    }

    const [schema, savedLayout, entry] = await Promise.all([
      this.schemaService.findOne(schemaSlug),
      this.layoutsService.findOne(schemaSlug),
      this.entryModel.findOne({ _id: id, schemaSlug }).exec(),
    ]);

    if (!entry) throw new NotFoundException('Entry not found');

    // Client layout takes precedence over the global layout
    const savedBlocks = clientLayouts.get(schemaSlug) ?? savedLayout?.blocks ?? null;

    return {
      _id: String(entry._id),
      schemaSlug: entry.schemaSlug,
      blocks: await this.resolveBlocks(schema, savedBlocks, entry.data as Record<string, unknown>),
      createdAt: entry.createdAt?.toISOString?.() ?? undefined,
    };
  }
}
