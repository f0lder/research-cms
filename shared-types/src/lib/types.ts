

/** Built-in field types — well-typed, autocompleted. */
export type BuiltInFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'url'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'media'
  | 'select'
  | 'tags'
  | 'reference'
  | 'references'
  | 'blocks';

/** Open field type — built-in or any plugin-defined string. */
export type FieldType = BuiltInFieldType | (string & {});

/** Built-in field configurations — well-typed for autocomplete. */
export type BuiltInFieldConfig =
  | { type: 'select'; options: string[] }
  | { type: 'tags' }
  | { type: 'reference'; targetSlug: string }
  | { type: 'references'; targetSlug: string };

/** Plugin field configurations — arbitrary for extensibility. */
export type PluginFieldConfig = {
  type: string;
  [key: string]: unknown;
};

/** Per-type metadata — built-in or plugin-defined. */
export type FieldConfig = BuiltInFieldConfig | PluginFieldConfig;

/** Built-in field values — serializable to JSON. */
export type BuiltInFieldValue = string | number | boolean | string[];

/** Plugin field values — arbitrary serializable structures. */
export type PluginFieldValue = Record<string, unknown> | unknown[];

/** Field value as stored in database. */
export type FieldValue = BuiltInFieldValue | PluginFieldValue;

/** Field value after population (resolved references + plugin metadata). */
export type ResolvedFieldValue =
  | FieldValue
  | ContentEntry
  | MediaEntry
  | ContentEntry[]
  | null;

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  /** Present only for types that need extra configuration (select, tags, …). */
  config?: FieldConfig;
}

export interface ContentTypeDefinition {
  _id?: string;
  name: string;
  slug: string;
  fields: FieldDefinition[];
  /** System schemas (e.g. media) cannot be deleted or renamed. */
  system?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** A single content entry whose shape is defined by a ContentTypeDefinition. */
export interface ContentEntry {
  _id?: string;
  schemaSlug: string;
  /** Keyed by field name, values depend on FieldType. */
  data: Record<string, FieldValue>;
  /** Publishing status — draft, scheduled, published, archived. */
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  /** Soft delete marker — if set, entry is in trash. */
  deletedAt?: string;
  /** Publish at this time (for scheduled publishing). */
  publishAt?: string;
  /** Unpublish at this time (for automatic archiving). */
  unpublishAt?: string;
  /** Version number for content versioning. */
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ── Media ─────────────────────────────────────────────────────────────────────

export const MEDIA_SCHEMA_SLUG = 'media';

/** Shape of a resolved media entry (used in admin picker + public API). */
export interface MediaEntry {
  _id: string;
  title: string;
  url: string;
  caption?: string;
  altText?: string;
  mimeType?: string;
  fileSize?: number;
  createdAt?: string;
}

// ── Pages ─────────────────────────────────────────────────────────────────────

/**
 * Built-in schema slug for pages.
 * Pages are entries in this schema, linked to clients.
 * This allows Field blocks on pages to access page-specific fields.
 */
export const PAGE_SCHEMA_SLUG = 'page';

/**
 * Built-in page schema definition.
 * Auto-registered on system startup.
 * Defines the structure of pages: title, description, featured image, etc.
 */
export const PAGE_SCHEMA_DEFINITION: Omit<ContentTypeDefinition, '_id' | 'createdAt' | 'updatedAt'> = {
  name: 'Page',
  slug: PAGE_SCHEMA_SLUG,
  system: true, // Cannot be deleted or renamed
  fields: [
    {
      name: 'clientId',
      label: 'Client',
      type: 'text',
      required: true,
    },
    {
      name: 'title',
      label: 'Page Title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      label: 'URL Slug',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: false,
    },
    {
      name: 'featured_image',
      label: 'Featured Image',
      type: 'media',
      required: false,
    },
    {
      name: 'isHome',
      label: 'Mark as Homepage',
      type: 'boolean',
      required: false,
    },
    {
      name: 'blocks',
      label: 'Page Blocks',
      type: 'blocks',
      required: false,
    },
  ],
};

// ── Block Schema & Registry ───────────────────────────────────────────────────

/**
 * Describes a configuration field in a block's schema.
 * Used by admin UI to auto-generate the form for a block type.
 */
export interface BlockSchemaField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'boolean'
    | 'select'
    | 'color'
    | 'spacing'
    | 'schema-picker'       // picks a CMS schema slug
    | 'field-picker'        // picks a field from a schema
    | 'field-picker-multi'  // picks multiple fields from a schema
    | 'entry-picker'        // picks a specific entry
    | 'action-picker'       // button action config
    | 'blocks'              // nested blocks (for layout blocks)
    | 'columns'             // row columns (for row layout blocks)
    | 'image-url';
  options?: string[];        // for select type
  schemaSlug?: string;       // for entry-picker type: which schema to pick entries from
  defaultValue?: unknown;
  required?: boolean;
  description?: string;
}

/**
 * Schema describing a block type's configuration.
 * Allows admin UI to generate forms generically.
 */
export interface BlockSchema {
  fields: BlockSchemaField[];
}

/**
 * Context passed to resolve functions.
 * Plugins can extend this via module augmentation.
 */
export interface BlockResolveContext {
  depth: number;
  maxDepth: number;
  /** Custom data passed by the resolver caller */
  meta?: Record<string, unknown>;
}

/**
 * Definition of a block type — contract every block must satisfy.
 * Used for registration in the block registry.
 */
export interface BlockDefinition<TBlock extends BaseBlock = BaseBlock> {
  // Identity
  type: string;                      // 'heading', 'archive', etc.
  label: string;                     // 'Heading', 'Archive', etc.
  icon: string;                      // Emoji or icon name
  category: 'static' | 'content' | 'layout';
  description?: string;

  // Schema — describes what config fields this block type has
  schema: BlockSchema;

  // Default config when a new block is created
  defaultConfig: () => Omit<TBlock, keyof BaseBlock>;

  // Optional async resolution — called server-side
  // Static blocks skip this; content blocks (archive, entry) use it
  resolve?: (block: TBlock, context: BlockResolveContext) => Promise<TBlock>;
}

/**
 * Registry of all block types in the system.
 * Shared across admin, API, and Expo.
 */
export class BlockRegistry {
  private definitions = new Map<string, BlockDefinition<BaseBlock>>();

  /**
   * Register a new block type.
   * Throws if the type is already registered.
   */
  register<T extends BaseBlock>(definition: BlockDefinition<T>): void {
    if (this.definitions.has(definition.type)) {
      throw new Error(`Block type "${definition.type}" already registered`);
    }
    this.definitions.set(definition.type, definition as BlockDefinition<BaseBlock>);
  }

  /**
   * Get definition for a block type, or undefined if not found.
   */
  get(type: string): BlockDefinition<BaseBlock> | undefined {
    return this.definitions.get(type);
  }

  /**
   * Get all registered definitions.
   */
  getAll(): BlockDefinition<BaseBlock>[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Get definitions in a specific category.
   */
  getByCategory(category: string): BlockDefinition<BaseBlock>[] {
    return this.getAll().filter(d => d.category === category);
  }

  /**
   * Create a new block with all required base properties.
   * Uses the definition's defaultConfig() to populate specific fields.
   */
  getDefaultConfig(type: string): Block {
    const { v4: uuidv4 } = require('uuid');
    const def = this.get(type);
    if (!def) throw new Error(`Unknown block type: "${type}"`);
    return {
      id: uuidv4(),
      type,
      visible: true,
      order: 0,
      ...def.defaultConfig(),
    } as Block;
  }
}

// Export single shared instance
export const blockRegistry = new BlockRegistry();


// ── Block Spacing & Styling ───────────────────────────────────────────────────

/** Spacing definition (top, right, bottom, left). */
export interface Spacing {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/** Border configuration. */
export interface BorderConfig {
  width?: number;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  radius?: number;
}

/** Archive filtering. */
export interface ArchiveFilter {
  field: string;
  operator: 'eq' | 'ne' | 'contains' | 'gt' | 'lt';
  value: unknown;
}

// ── Base Block & Navigation ────────────────────────────────────────────────────

/** Action that can be triggered by ButtonBlock or CardBlock. */
export type ButtonAction =
  | { type: 'navigate'; pageSlug: string }
  | { type: 'url'; url: string }
  | { type: 'schema'; schemaSlug: string }
  | { type: 'entry'; schemaSlug: string; entryId: string };

/** Base properties inherited by all block types. */
export interface BaseBlock {
  id: string;                        // uuid — stable for drag/drop
  type: string;                      // discriminant
  visible: boolean;                  // show/hide toggle
  order: number;                     // position in parent

  // Spacing
  padding?: Spacing;
  margin?: Spacing;

  // Visual
  backgroundColor?: string;
  borderRadius?: number;
  border?: BorderConfig;

  // Responsive
  hideOn?: ('mobile' | 'tablet' | 'desktop')[];

  // Animation (Expo)
  animation?: 'none' | 'fadeIn' | 'slideUp' | 'slideIn';

  // Metadata
  meta?: Record<string, unknown>;
}

// ── Static Blocks ─────────────────────────────────────────────────────────────

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  text: string;
  level?: 1 | 2 | 3 | 4;
  align?: 'left' | 'center' | 'right';
  color?: string;
  fontWeight?: 'normal' | 'bold' | 'semibold';
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  color?: string;
  thickness?: number;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface SpacerBlock extends BaseBlock {
  type: 'spacer';
  height: number;  // px
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  mediaId: string;          // Reference to media schema entry
  media?: MediaEntry;       // Resolved at server-side
  alt?: string;
  width?: number | 'full';
  height?: number;
  fit?: 'cover' | 'contain' | 'fill';
  linkUrl?: string;         // optional tap action
}

export interface ButtonBlock extends BaseBlock {
  type: 'button';
  label: string;
  action: ButtonAction;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  align?: 'left' | 'center' | 'right' | 'full';
  icon?: string;
}

// ── Content Blocks ────────────────────────────────────────────────────────────

export interface FieldBlock extends BaseBlock {
  type: 'field';
  fieldName: string;
  label: string;
  fieldType: FieldType;
  showLabel?: boolean;
  labelPosition?: 'above' | 'inline' | 'hidden';
  value: ResolvedFieldValue;  // resolved server-side
}

export interface ArchiveBlock extends BaseBlock {
  type: 'archive';
  schemaSlug: string;
  title?: string;
  limit?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  filter?: ArchiveFilter[];
  layout?: 'list' | 'grid' | 'carousel';
  columns?: 1 | 2 | 3;
  showPagination?: boolean;
  emptyMessage?: string;
  items?: ResolvedEntry[];  // resolved server-side
}

export interface EntryBlock extends BaseBlock {
  type: 'entry';
  schemaSlug: string;
  entryId: string;
  showFields?: string[];
  entry?: ResolvedEntry;  // resolved server-side
}

// ── Layout Blocks ─────────────────────────────────────────────────────────────

export interface ColumnBlock extends BaseBlock {
  type: 'column';
  width?: number | 'auto' | 'full';
  blocks: Block[];
}

export interface RowBlock extends BaseBlock {
  type: 'row';
  columns: ColumnBlock[];
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  wrap?: boolean;
}

export interface CardBlock extends BaseBlock {
  type: 'card';
  blocks: Block[];
  elevation?: number;
  pressAction?: ButtonAction;
}

// ── Unified Block Type ─────────────────────────────────────────────────────────

/** All block types (exhaustive union). */
export type Block =
  // Static
  | HeadingBlock
  | TextBlock
  | DividerBlock
  | SpacerBlock
  | ImageBlock
  | ButtonBlock
  // Content
  | ArchiveBlock
  | EntryBlock
  | FieldBlock
  // Layout
  | RowBlock
  | ColumnBlock
  | CardBlock;

export type BlockType = Block['type'];

// ── Templates (no resolved values) ─────────────────────────────────────────────

/**
 * Layout template blocks — no resolved data.
 * Used in ClientLayout to define schema rendering templates.
 */
export type LayoutBlock =
  | Omit<FieldBlock, 'value'>
  | Omit<ArchiveBlock, 'items'>
  | Omit<EntryBlock, 'entry'>;

// ── Resolved Entry Response ────────────────────────────────────────────────────

export interface ResolvedEntry {
  _id: string;
  schemaSlug: string;
  data: Record<string, FieldValue>;
  blocks: Block[];
  createdAt?: string;
  updatedAt?: string;
}

/** Shape of a public API entry response. */
export interface PublicEntryResponse {
  _id: string;
  schemaSlug: string;
  data?: Record<string, unknown>;
  blocks: Block[];
  createdAt?: string;
}

/** Shape of a public page entry response — includes data for accessing page fields. */
export interface PageEntryResponse extends PublicEntryResponse {
  schemaSlug: 'page';
  data: {
    title?: string;
    slug?: string;
    description?: string;
    featured_image?: string;
    isHome?: boolean;
  };
}

// ── Logs ──────────────────────────────────────────────────────────────────────

export interface LogEntry {
  _id?: string;
  message: string;
  tags: string[];
  meta?: Record<string, unknown>;
  createdAt?: string;
}

export interface ActivityItem {
  id: string;
  message: string;
  tags: string[];
  level: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}


// ── Clients (formerly API Keys) ───────────────────────────────────────────────

/** Per-schema block layout stored on a client — keyed by ContentType _id. */
export interface ClientLayout {
  schemaId: string;
  blocks: LayoutBlock[];
}

export interface Client {
  _id?: string;
  name: string;
  key: string;
  hits: number;
  lastUsedAt?: string | null;
  active: boolean;
  /** Empty array = all schemas allowed. Non-empty = only listed slugs accessible. */
  allowedSchemas: string[];
  /** Per-schema block layout overrides. */
  layouts: ClientLayout[];
  /** _id of the page to show as the home/landing screen. */
  homePage?: string | null;
  createdAt?: string;
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export interface Webhook {
  _id: string;
  name: string;
  url: string;
  events: string[];
  schemas: string[];
  active: boolean;
  secret?: string | null;
  successCount: number;
  failureCount: number;
  lastTriggeredAt?: string | null;
  lastError?: string | null;
  createdAt?: string;
}
