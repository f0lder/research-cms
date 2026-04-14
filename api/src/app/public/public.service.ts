import { Injectable, NotFoundException } from '@nestjs/common';
import { SchemaService } from '../schema/schema.service';
import { LayoutsService } from '../layouts/layouts.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContentEntryModel, ContentEntryDocument } from '../content/schemas/content-entry.schema';
import {
  FieldType,
  FieldValue,
  ResolvedFieldValue,
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
   * Resolves all MEDIA references (field blocks + image blocks) with a single DB query.
   */
  private async resolveMediaBatch(
    blocks: (Block | LayoutBlock)[],
    data: Record<string, unknown>,
    fieldMap: Map<string, { type: FieldType }>,
  ): Promise<Map<string, MediaEntry | null>> {
    const mediaIds = new Set<string>();

    // Collect media IDs from field blocks with media type
    blocks
      .filter((b): b is FieldBlock | Omit<FieldBlock, 'value'> => b.type === 'field')
      .filter(b => fieldMap.get(b.fieldName)?.type === 'media')
      .forEach(b => {
        const val = data[b.fieldName];
        if (typeof val === 'string') mediaIds.add(val);
      });

    // Collect media IDs from image blocks
    blocks
      .filter((b): b is any => b.type === 'image')
      .forEach(b => {
        if (typeof b.mediaId === 'string') mediaIds.add(b.mediaId);
      });

    if (mediaIds.size === 0) return new Map();

    const docs = await this.entryModel
      .find({ _id: { $in: Array.from(mediaIds) }, schemaSlug: MEDIA_SCHEMA_SLUG })
      .exec();

    return new Map(docs.map(d => [String(d._id), this.docToMediaEntry(d)]));
  }

  private async resolveReferencesBatch(
    blocks: (Block | LayoutBlock)[],
    data: Record<string, unknown>,
    fieldMap: Map<string, { type: FieldType }>,
  ): Promise<Map<string, any>> {
    // Collect all reference IDs (both single and array references)
    const refIds = new Set<string>();
    
    blocks
      .filter((b): b is FieldBlock | Omit<FieldBlock, 'value'> => b.type === 'field')
      .forEach(b => {
        const fieldType = fieldMap.get(b.fieldName)?.type;
        if (fieldType === 'reference' || fieldType === 'references') {
          const val = data[b.fieldName];
          if (typeof val === 'string') {
            refIds.add(val);
          } else if (Array.isArray(val)) {
            val.forEach((v: any) => {
              if (typeof v === 'string') refIds.add(v);
            });
          }
        }
      });

    if (refIds.size === 0) return new Map();

    // Fetch all referenced entries (don't filter by schema — they could be from any schema)
    const docs = await this.entryModel.find({ _id: { $in: Array.from(refIds) } }).exec();

    return new Map(docs.map(d => [String(d._id), {
      _id: String(d._id),
      schemaSlug: d.schemaSlug,
      title: d.data?.title || d.data?.name || `Entry ${String(d._id).slice(0, 8)}`,
      data: d.data,
    }]));
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
    
    // Sync saved blocks against current schema to pick up any field type changes
    const layoutBlocks = this.layoutsService.syncWithSchema(schema as any, savedBlocks);

    // Filter and sort visible field blocks
    const visibleBlocks = layoutBlocks
      .filter(b => {
        if (b.type === 'field') return (b as FieldBlock).visible !== false;
        return true; // Keep all static blocks
      })
      .sort((a, b) => {
        // Sort ALL blocks by order field
        const aOrder = (a as any).order ?? 999;
        const bOrder = (b as any).order ?? 999;
        return aOrder - bOrder;
      });

    // Batch-resolve all media IDs and references in one query each
    const mediaMap = await this.resolveMediaBatch(visibleBlocks, data, fieldMap);
    const referencesMap = await this.resolveReferencesBatch(visibleBlocks, data, fieldMap);

    // Resolve blocks: fill field blocks with data, pass static blocks through
    const results = visibleBlocks.map(b => {
      if (b.type === 'field') {
        const fieldBlock = b as FieldBlock;
        const field = fieldMap.get(fieldBlock.fieldName);
        const raw = data[fieldBlock.fieldName] ?? null;
        
        let value: ResolvedFieldValue;
        if (field?.type === 'media' && typeof raw === 'string') {
          value = mediaMap.get(raw) ?? null;
        } else if (field?.type === 'reference' && typeof raw === 'string') {
          value = referencesMap.get(raw) ?? null;
        } else if (field?.type === 'references' && Array.isArray(raw)) {
          value = raw.map((id: string) => referencesMap.get(id) ?? null);
        } else {
          value = raw as ResolvedFieldValue;
        }

        return {
          ...fieldBlock,
          type: 'field' as const,
          fieldName: fieldBlock.fieldName,
          label: fieldBlock.label,
          fieldType: fieldBlock.fieldType,
          value,
          visible: fieldBlock.visible !== false,
          order: fieldBlock.order ?? 0,
        } as FieldBlock;
      }
      // Resolve image blocks with media
      if (b.type === 'image') {
        const imageBlock = b as any;
        return {
          ...imageBlock,
          media: mediaMap.get(imageBlock.mediaId) ?? undefined,
        };
      }
      // Other static blocks pass through unchanged
      return b;
    });
    
    return results;
  }

  // ─── Public API methods ───────────────────────────────────────────────────

  /**
   * Resolves media in page blocks (image blocks only).
   * Pages have no entry data, so we only resolve image block media.
   */
  async resolvePageBlocksMedia(blocks: (Block | LayoutBlock)[]): Promise<Block[]> {
    // Collect all image mediaIds
    const mediaIds = new Set<string>();
    blocks
      .filter((b): b is any => b.type === 'image')
      .forEach(b => {
        if (typeof b.mediaId === 'string') mediaIds.add(b.mediaId);
      });

    if (mediaIds.size === 0) return blocks as Block[];

    // Fetch all media
    const docs = await this.entryModel
      .find({ _id: { $in: Array.from(mediaIds) }, schemaSlug: MEDIA_SCHEMA_SLUG })
      .exec();

    const mediaMap = new Map(docs.map(d => [String(d._id), this.docToMediaEntry(d)]));

    // Resolve image blocks
    return (blocks as Block[]).map(b => {
      if (b.type === 'image') {
        const imageBlock = b as any;
        return {
          ...imageBlock,
          media: mediaMap.get(imageBlock.mediaId) ?? undefined,
        };
      }
      return b;
    });
  }

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
      entries.map(async e => {
        const item: any = {
          _id: String(e._id),
          schemaSlug: e.schemaSlug,
          data: e.data as Record<string, unknown>,
          blocks: await this.resolveBlocks(schema, savedBlocks, e.data as Record<string, unknown>),
          createdAt: e.createdAt?.toISOString?.() ?? undefined,
        };
        return item;
      })
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
    const resolvedBlocks = await this.resolveBlocks(schema, savedBlocks, entry.data);

    const item: any = {
      _id: String(entry._id),
      schemaSlug: entry.schemaSlug,
      data: entry.data as Record<string, unknown>,
      blocks: resolvedBlocks,
      createdAt: entry.createdAt?.toISOString?.() ?? undefined,
    };

    return item;
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
      entries.map(async e => {
        const item: any = {
          _id: String(e._id),
          schemaSlug: e.schemaSlug,
          data: e.data as Record<string, unknown>,
          blocks: await this.resolveBlocks(schema, savedBlocks, e.data as Record<string, unknown>),
          createdAt: e.createdAt?.toISOString?.() ?? undefined,
        };
        return item;
      })
    );

    return { items, total, page, limit };
  }
}
