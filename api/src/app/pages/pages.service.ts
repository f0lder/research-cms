import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Block, LayoutBlock, ResolvedEntry, ArchiveBlock, ColumnBlock, RowBlock, CardBlock, FieldBlock, blockRegistry, BlockResolveContext, PAGE_SCHEMA_SLUG, ContentEntry } from '@research-cms/shared-types';
import { ContentService } from '../content/content.service';

@Injectable()
export class PagesService {
  private readonly MAX_ARCHIVE_DEPTH = 2;

  constructor(
    private contentService: ContentService,
  ) {}

  /**
   * Find all pages for a client.
   * Pages are entries in the page schema with clientId field.
   */
  async findAllForClient(clientId: string): Promise<ContentEntry[]> {
    const result = await this.contentService.findAll(PAGE_SCHEMA_SLUG, 1, 1000);
    return result.items
      .filter(entry => entry.data?.clientId === clientId)
      .map(entry => this.toContentEntry(entry));
  }

  /**
   * Find a single page entry by ID.
   */
  async findOne(clientId: string, pageId: string): Promise<ContentEntry> {
    const entry = await this.contentService.findOne(PAGE_SCHEMA_SLUG, pageId);
    if (!entry || entry.data?.clientId !== clientId) {
      throw new NotFoundException('Page not found');
    }
    return this.toContentEntry(entry);
  }

  /**
   * Find a page by slug (for public API).
   */
  async findBySlug(clientId: string, slug: string): Promise<ContentEntry> {
    const result = await this.contentService.findAll(PAGE_SCHEMA_SLUG, 1, 100);
    const entry = result.items.find(
      e => e.data?.clientId === clientId && e.data?.slug === slug
    );
    if (!entry) {
      throw new NotFoundException('Page not found');
    }
    return this.toContentEntry(entry);
  }

  /**
   * Convert Mongoose document to ContentEntry.
   */
  private toContentEntry(doc: any): ContentEntry {
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
      _id: String(obj._id),
      schemaSlug: obj.schemaSlug,
      data: obj.data,
      status: obj.status,
      deletedAt: obj.deletedAt ? String(obj.deletedAt) : undefined,
      publishAt: obj.publishAt ? String(obj.publishAt) : undefined,
      unpublishAt: obj.unpublishAt ? String(obj.unpublishAt) : undefined,
      version: obj.version,
      createdAt: obj.createdAt ? String(obj.createdAt) : undefined,
      updatedAt: obj.updatedAt ? String(obj.updatedAt) : undefined,
    };
  }

  /**
   * Delete a page entry by ID.
   */
  async delete(clientId: string, pageId: string): Promise<void> {
    const entry = await this.contentService.findOne(PAGE_SCHEMA_SLUG, pageId);
    if (!entry || entry.data?.clientId !== clientId) {
      throw new NotFoundException('Page not found');
    }
    await this.contentService.delete(PAGE_SCHEMA_SLUG, pageId);
  }

  /**
   * Resolve all blocks for a page, fetching data and establishing layouts.
   * clientLayouts: Map of schemaSlug → LayoutBlock[] (templates for how to render entries)
   */
  async resolveBlocks(
    blocks: Block[],
    clientLayouts: Map<string, LayoutBlock[]>,
    depth: number = 0,
  ): Promise<Block[]> {
    return Promise.all(
      blocks.map(block => this.resolveBlock(block, clientLayouts, depth))
    );
  }

  /**
   * Extract all schema slugs referenced in a block tree via archive/entry blocks.
   * Used to pre-load layouts for nested content resolution.
   */
  async extractReferencedSchemas(blocks: Block[]): Promise<Set<string>> {
    const schemas = new Set<string>();

    const visitBlock = (block: any) => {
      if (block.type === 'archive' && block.schemaSlug) {
        schemas.add(block.schemaSlug);
      } else if (block.type === 'entry' && block.schemaSlug) {
        schemas.add(block.schemaSlug);
      }
      
      // Recursively visit child blocks
      if (block.children && Array.isArray(block.children)) {
        block.children.forEach(visitBlock);
      }
      if (block.blocks && Array.isArray(block.blocks)) {
        block.blocks.forEach(visitBlock);
      }
      if (block.items && Array.isArray(block.items)) {
        block.items.forEach(visitBlock);
      }
    };

    blocks.forEach(visitBlock);
    return schemas;
  }

  /**
   * Resolve a single block using the block registry.
   * The service handles actual resolution based on block type.
   * Static blocks are returned as-is; content/layout blocks are resolved.
   */
  private async resolveBlock(
    block: Block,
    clientLayouts: Map<string, LayoutBlock[]>,
    depth: number,
  ): Promise<Block> {
    const definition = blockRegistry.get(block.type);
    
    // Unknown block type — return as-is (may be a plugin block)
    if (!definition) {
      return block;
    }

    // Handle specific block types that need resolution
    switch (block.type) {
      case 'archive':
        return this.resolveArchiveBlock(block as ArchiveBlock, clientLayouts, depth);
      
      case 'entry':
        return this.resolveEntryBlock(block as any, clientLayouts, depth);
      
      case 'image':
        return this.resolveImageBlock(block as any, clientLayouts, depth);
      
      case 'row':
        return this.resolveRowBlock(block as RowBlock, clientLayouts, depth);
      
      case 'card':
        return this.resolveCardBlock(block as CardBlock, clientLayouts, depth);
      
      // Static blocks — return as-is
      default:
        return block;
    }
  }

  /**
   * Handle specific block types that need custom resolution logic.
   * This is called by the block definitions' resolve functions.
   */
  async resolveArchiveBlock(
    block: ArchiveBlock,
    clientLayouts: Map<string, LayoutBlock[]>,
    depth: number,
  ): Promise<ArchiveBlock> {
    // Depth guard prevents infinite recursion
    if (depth > this.MAX_ARCHIVE_DEPTH) {
      return { ...block, items: [] };
    }

    // Fetch entries from content service
    const filter = block.filter 
      ? this.buildMongoFilter(block.filter) 
      : {};
    
    const result = await this.contentService.findAll(
      block.schemaSlug,
      1,
      block.limit ?? 10,
    );
    
    let entries = result.items;

    // Apply sorting if specified
    if (block.orderBy) {
      entries.sort((a, b) => {
        const aVal = a.data[block.orderBy];
        const bVal = b.data[block.orderBy];
        if (aVal < bVal) return block.orderDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return block.orderDir === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by createdAt
      entries.sort((a, b) => {
        const aTime = new Date(a.createdAt || '').getTime();
        const bTime = new Date(b.createdAt || '').getTime();
        return block.orderDir === 'asc' ? aTime - bTime : bTime - aTime;
      });
    }

    // Get layout template for this schema
    const layout = clientLayouts.get(block.schemaSlug) ?? [];

    // Resolve each entry's blocks with depth tracking
    const items = await Promise.all(
      entries.map(entry => 
        this.resolveEntry(entry, layout, clientLayouts, depth + 1)
      )
    );

    return { ...block, items };
  }

  async resolveEntryBlock(
    block: any,
    clientLayouts: Map<string, LayoutBlock[]>,
    depth: number,
  ): Promise<any> {
    // Fetch specific entry
    try {
      const entry = await this.contentService.findOne(
        block.schemaSlug,
        block.entryId,
      );
      if (!entry) return { ...block, entry: undefined };

      const entryLayout = clientLayouts.get(block.schemaSlug) ?? [];
      const resolved = await this.resolveEntry(
        entry,
        entryLayout,
        clientLayouts,
        depth + 1,
      );

      return { ...block, entry: resolved };
    } catch {
      return { ...block, entry: undefined };
    }
  }

  async resolveImageBlock(
    block: any,
    clientLayouts: Map<string, LayoutBlock[]>,
    depth: number,
  ): Promise<any> {
    // If mediaId is provided, resolve it to get the URL
    if (!block.mediaId) return block;

    try {
      const media = await this.contentService.findOne('media', block.mediaId);
      if (!media) return block;

      // Merge media data with image block (url, title, altText, etc.)
      return {
        ...block,
        url: media.data?.url,
        alt: block.alt || media.data?.altText,
        media, // Keep full media object for reference
      };
    } catch {
      return block;
    }
  }

  async resolveRowBlock(
    block: RowBlock,
    clientLayouts: Map<string, LayoutBlock[]>,
    depth: number,
  ): Promise<RowBlock> {
    // Recursively resolve columns
    const resolvedColumns = await Promise.all(
      block.columns.map(async (col) => ({
        ...col,
        blocks: await this.resolveBlocks(col.blocks, clientLayouts, depth),
      }))
    );

    return { ...block, columns: resolvedColumns };
  }

  async resolveCardBlock(
    block: CardBlock,
    clientLayouts: Map<string, LayoutBlock[]>,
    depth: number,
  ): Promise<CardBlock> {
    // Resolve nested blocks
    const resolvedBlocks = await this.resolveBlocks(
      block.blocks,
      clientLayouts,
      depth,
    );

    return { ...block, blocks: resolvedBlocks };
  }

  /**
   * Resolve an entry by applying its layout template and resolving nested blocks.
   */
  private async resolveEntry(
    entry: any,
    layout: LayoutBlock[],
    clientLayouts: Map<string, LayoutBlock[]>,
    depth: number,
  ): Promise<ResolvedEntry> {
    // Convert layout templates to resolved field blocks
    const fieldBlocks = await Promise.all(
      layout
        .filter(layoutBlock => layoutBlock.type === 'field')
        .map(async (layoutBlock: any) => {
          const value = entry.data[layoutBlock.fieldName];
          return {
            ...layoutBlock,
            value,
          } as FieldBlock;
        })
    );

    // Resolve nested blocks in layout blocks (if any)
    const resolvedBlocks = await Promise.all(
      fieldBlocks.map(b => this.resolveBlock(b, clientLayouts, depth))
    );

    return {
      _id: entry._id,
      schemaSlug: entry.schemaSlug,
      data: entry.data,
      blocks: resolvedBlocks,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  /**
   * Build MongoDB filter object from ArchiveFilter array.
   */
  private buildMongoFilter(filters: any[]): Record<string, any> {
    const mongoFilter: Record<string, any> = {};

    for (const filter of filters) {
      const fieldPath = `data.${filter.field}`;
      
      switch (filter.operator) {
        case 'eq':
          mongoFilter[fieldPath] = filter.value;
          break;
        case 'ne':
          mongoFilter[fieldPath] = { $ne: filter.value };
          break;
        case 'contains':
          mongoFilter[fieldPath] = { $regex: filter.value, $options: 'i' };
          break;
        case 'gt':
          mongoFilter[fieldPath] = { $gt: filter.value };
          break;
        case 'lt':
          mongoFilter[fieldPath] = { $lt: filter.value };
          break;
      }
    }

    return mongoFilter;
  }

  /**
   * Resolve blocks for a page, preventing infinite recursion on nested ArchiveBlocks.
   * Archives deeper than MAX_ARCHIVE_DEPTH are returned unresolved.
   * @deprecated Use resolveBlocks() instead
   */
  private resolveBlocksWithDepthGuard(blocks: Block[], depth = 0): Block[] {
    // If we've exceeded max depth, return ArchiveBlocks unresolved (empty items)
    if (depth > this.MAX_ARCHIVE_DEPTH) {
      return blocks.map(b => 
        b.type === 'archive' ? { ...b, items: [] } : b
      );
    }
    
    // For future use: recursively resolve ArchiveBlock items
    // Items would be fetched and their blocks resolved with depth + 1
    // For now, blocks are resolved at request time by public API handler
    return blocks;
  }
}
