export enum FieldType {
  // Text
  TEXT = 'text',
  TEXTAREA = 'textarea',
  EMAIL = 'email',
  URL = 'url',
  // Numeric
  NUMBER = 'number',
  // Date / time
  DATE = 'date',
  DATETIME = 'datetime',
  // Toggle
  BOOLEAN = 'boolean',
  // Media (reference to the built-in media schema — use mimeType to distinguish image/video/etc.)
  MEDIA = 'media',
  // Choice
  SELECT = 'select',
  TAGS = 'tags',
  // Relations
  REFERENCE = 'reference',
  REFERENCES = 'references',
}

/** Per-type metadata carried alongside a field definition. */
export type FieldConfig =
  | { type: 'select'; options: string[] }
  | { type: 'tags' }
  | { type: 'reference'; targetSlug: string }
  | { type: 'references'; targetSlug: string };

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

/** All possible values a content field can hold. */
export type FieldValue = string | number | boolean | string[];

/** A single content entry whose shape is defined by a ContentTypeDefinition. */
export interface ContentEntry {
  _id?: string;
  schemaSlug: string;
  /** Keyed by field name, values depend on FieldType. */
  data: Record<string, FieldValue>;
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
  value: FieldValue | MediaEntry | null;
  visible: boolean;
  order: number;
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
