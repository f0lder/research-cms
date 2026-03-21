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
  // Media
  IMAGE = 'image',
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
  blocks: BlockDefinition[];
  updatedAt?: string;
}

/** A single block with its resolved value, returned by the public API. */
export interface PublicBlock extends BlockDefinition {
  value: FieldValue | null;
}

/** Shape of a public API entry response. */
export interface PublicEntryResponse {
  _id: string;
  schemaSlug: string;
  blocks: PublicBlock[];
  createdAt?: string;
}

// ── API Keys ──────────────────────────────────────────────────────────────────

export interface ApiKey {
  _id?: string;
  name: string;
  key: string;
  hits: number;
  lastUsedAt?: string;
  active: boolean;
  createdAt?: string;
}