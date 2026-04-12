// ── Field Types (open for extensions via plugins) ────────────────────────────

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
  | 'references';

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

// ── Block Layout ──────────────────────────────────────────────────────────────

/** One block in a layout — corresponds to a field on the schema. */
export interface BlockDefinition {
  fieldName: string;
  label: string;
  type: FieldType;
  visible: boolean;
  order: number;
}

/** Saved layout for a content type — one document per schema slug. */
export interface BlockLayout {
  _id?: string;
  schemaSlug: string;
  blocks: Block[];
  updatedAt?: string;
}

// ── Unified Blocks (for pages and entries) ────────────────────────────────────

/** Block that displays a field from an entry. */
export interface FieldBlock {
  type: 'field';
  fieldName: string;
  label: string;
  fieldType: FieldType;
  value: ResolvedFieldValue;
  visible: boolean;
  order: number;
  /** Plugin extra resolved data for this field. */
  meta?: Record<string, unknown>;
}

/** Block that displays a heading. */
export interface HeadingBlock {
  type: 'heading';
  text: string;
  level?: 1 | 2 | 3;
}

/** Block that displays static text. */
export interface TextBlock {
  type: 'text';
  content: string;
}

/**
 * Block that renders a list of entries from a schema inline.
 * The client's block layout for that schema is applied automatically.
 */
export interface ArchiveBlock {
  type: 'archive';
  schemaSlug: string;
  title?: string;
  /** Max entries to show. Defaults to 5. */
  limit?: number;
}

/** Unified block type used across pages and entries. */
export type Block = FieldBlock | HeadingBlock | TextBlock | ArchiveBlock;

/** Shape of a public API entry response. */
export interface PublicEntryResponse {
  _id: string;
  schemaSlug: string;
  blocks: Block[];
  createdAt?: string;
}

// ── Logs ──────────────────────────────────────────────────────────────────────

export interface LogEntry {
  _id?: string;
  message: string;
  tags: string[];
  meta?: Record<string, unknown>;
  createdAt?: string;
}

export type PageStatus = 'draft' | 'published';

export interface ClientPage {
  _id?: string;
  clientId: string;
  title: string;
  slug: string;
  status: PageStatus;
  blocks: Block[];
  /** MongoDB _id of the parent page, or null/undefined for top-level pages. */
  parentId?: string | null;
  /** Injected by the public API — true when this page is the client's designated home page. */
  isHome?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ── Clients (formerly API Keys) ───────────────────────────────────────────────

/** Per-schema block layout override stored on a client. */
export interface ClientLayout {
  schemaSlug: string;
  blocks: Block[];
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

/** @deprecated Use Client instead */
export type ApiKey = Client;

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
