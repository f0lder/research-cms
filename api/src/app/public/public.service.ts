import { Injectable, NotFoundException } from '@nestjs/common';
import { SchemaService } from '../schema/schema.service';
import { LayoutsService } from '../layouts/layouts.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContentEntryModel, ContentEntryDocument } from '../content/schemas/content-entry.schema';
import {
  FieldType,
  FieldValue,
  MediaEntry,
  Block,
  FieldBlock,
  LayoutBlock,
  PublicEntryResponse,
  MEDIA_SCHEMA_SLUG,
} from '@research-cms/shared-types';

// Filter for published entries — uses system-level status field
const PUBLISHED_FILTER = {
  status: 'published',
  deletedAt: null,
};

// Reference fields return the raw ObjectId string by design — resolving them would
// require recursive schema lookups and add significant latency. Mobile/web consumers
// can follow up with GET /public/:targetSlug/:id if they need the full document.

@Injectable()
export class PublicService {
  constructor(
    private readonly schemaService: SchemaService,
    private readonly layoutsService: LayoutsService, // still used for syncWithSchema helper
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
   * Resolves all MEDIA field values in a set of blocks with a single DB query.
   * Only processes field blocks; static blocks are passed through as-is.
   */
  private async resolveMediaBatch(
    blocks: (Block | LayoutBlock)[],
    data: Record<string, unknown>,
    fieldMap: Map<string, { type: FieldType }>,
  ): Promise<Map<string, MediaEntry | null>> {
    const mediaIds = blocks
      .filter((b): b is FieldBlock | Omit<FieldBlock, 'value'> => b.type === 'field')
      .filter(b => fieldMap.get(b.fieldName)?.type === 'media')
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
   * `savedBlocks` is the layout to use (template blocks without values).
   * Null falls back to bootstrapping field blocks from the schema.
   */
  private async resolveBlocks(
    schema: { fields: { name: string; label: string; type: FieldType }[] },
    savedBlocks: (Block | LayoutBlock)[] | null,
    data: Record<string, unknown>,
  ): Promise<Block[]> {
    const fieldMap = new Map(schema.fields.map(f => [f.name, f]));
    
    // Get layout blocks (field + static), or bootstrap if none saved
    const layoutBlocks = savedBlocks ?? this.layoutsService.bootstrapFromSchema(schema as any).blocks;

    // Filter and sort visible field blocks
    const visibleBlocks = layoutBlocks
      .filter(b => {
        if (b.type === 'field') return (b as FieldBlock).visible !== false;
        return true; // Keep all static blocks
      })
      .sort((a, b) => {
        const aOrder = a.type === 'field' ? (a as FieldBlock).order : 999;
        const bOrder = b.type === 'field' ? (b as FieldBlock).order : 999;
        return aOrder - bOrder;
      });

    // Batch-resolve all media IDs in one query
    const mediaMap = await this.resolveMediaBatch(visibleBlocks, data, fieldMap);

    // Resolve blocks: fill field blocks with data, pass static blocks through
    return visibleBlocks.map(b => {
      if (b.type === 'field') {
        const fieldBlock = b as FieldBlock;
        const field = fieldMap.get(fieldBlock.fieldName);
        const raw = data[fieldBlock.fieldName] ?? null;
        const value = field?.type === 'media' && typeof raw === 'string'
          ? mediaMap.get(raw) ?? null
          : (raw as FieldValue | null);

        return {
          type: 'field' as const,
          fieldName: fieldBlock.fieldName,
          label: fieldBlock.label,
          fieldType: fieldBlock.fieldType,
          value,
          visible: fieldBlock.visible,
          order: fieldBlock.order,
        } as FieldBlock;
      }
      // Static blocks (heading, text, archive) pass through unchanged
      return b;
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
    clientLayouts: Map<string, Block[]> = new Map(),
  ): Promise<{ items: PublicEntryResponse[]; total: number; page: number; limit: number }> {
    // Fetch schema and entries in parallel
    const [schema, entries, total] = await Promise.all([
      this.schemaService.findOne(schemaSlug),
      this.entryModel
        .find({ schemaSlug, ...PUBLISHED_FILTER })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.entryModel.countDocuments({ schemaSlug, ...PUBLISHED_FILTER }),
    ]);

    // Use the client's layout for this schema; null falls back to schema-bootstrapped defaults
    const savedBlocks = clientLayouts.get(schemaSlug) ?? null;

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
    clientLayouts: Map<string, Block[]> = new Map(),
  ): Promise<PublicEntryResponse> {
    // Enforce API key schema restrictions — return 404 (not 403) to avoid
    // leaking the existence of schemas the key isn't permitted to access
    if (allowedSchemas.length > 0 && !allowedSchemas.includes(schemaSlug)) {
      throw new NotFoundException('Entry not found');
    }

    const [schema, entry] = await Promise.all([
      this.schemaService.findOne(schemaSlug),
      this.entryModel.findOne({ _id: id, schemaSlug, ...PUBLISHED_FILTER }).exec(),
    ]);

    if (!entry) throw new NotFoundException('Entry not found');

    const savedBlocks = clientLayouts.get(schemaSlug) ?? null;

    return {
      _id: String(entry._id),
      schemaSlug: entry.schemaSlug,
      blocks: await this.resolveBlocks(schema, savedBlocks, entry.data as Record<string, unknown>),
      createdAt: entry.createdAt?.toISOString?.() ?? undefined,
    };
  }

  async search(
    schemaSlug: string,
    query: string,
    page = 1,
    limit = 20,
    clientLayouts: Map<string, Block[]> = new Map(),
  ): Promise<{ items: PublicEntryResponse[]; total: number; page: number; limit: number }> {
    if (!query || query.trim().length === 0) {
      return { items: [], total: 0, page, limit };
    }

    // Fetch schema and search results in parallel
    const [schema, entries, total] = await Promise.all([
      this.schemaService.findOne(schemaSlug),
      this.entryModel
        .find({ schemaSlug, ...PUBLISHED_FILTER, $text: { $search: query } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.entryModel.countDocuments({ schemaSlug, ...PUBLISHED_FILTER, $text: { $search: query } }),
    ]);

    // Use the client's layout for this schema; null falls back to schema-bootstrapped defaults
    const savedBlocks = clientLayouts.get(schemaSlug) ?? null;

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
}
