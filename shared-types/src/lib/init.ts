// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM INITIALIZATION
// All shared init concerns live here:
//   - Built-in (system) schema definitions consumed by the API on boot
//   - Block registry bootstrap consumed by admin/mobile on startup
// ─────────────────────────────────────────────────────────────────────────────

import { ContentTypeDefinition, blockRegistry } from './types';
import { BUILT_IN_BLOCK_DEFINITIONS } from './blocks';

// ── System schema slugs ──────────────────────────────────────────────────────

export const MEDIA_SCHEMA_SLUG = 'media';
export const PAGE_SCHEMA_SLUG = 'page';

// ── System schema definitions ────────────────────────────────────────────────

export type SystemSchema = Omit<ContentTypeDefinition, '_id' | 'createdAt' | 'updatedAt'>;

export const MEDIA_SCHEMA_DEFINITION: SystemSchema = {
  name: 'Media',
  slug: MEDIA_SCHEMA_SLUG,
  system: true,
  fields: [
    { name: 'title',    label: 'Title',     type: 'text',     required: true  },
    { name: 'url',      label: 'File URL',  type: 'text',     required: true  },
    { name: 'caption',  label: 'Caption',   type: 'textarea', required: false },
    { name: 'altText',  label: 'Alt Text',  type: 'text',     required: false },
    { name: 'mimeType', label: 'MIME Type', type: 'text',     required: false },
    { name: 'fileSize', label: 'File Size', type: 'number',   required: false },
  ],
};

export const PAGE_SCHEMA_DEFINITION: SystemSchema = {
  name: 'Page',
  slug: PAGE_SCHEMA_SLUG,
  system: true,
  fields: [
    { name: 'clientId',       label: 'Client',             type: 'text',     required: true  },
    { name: 'title',          label: 'Page Title',         type: 'text',     required: true  },
    { name: 'slug',           label: 'URL Slug',           type: 'text',     required: true  },
    { name: 'description',    label: 'Description',        type: 'textarea', required: false },
    { name: 'featured_image', label: 'Featured Image',     type: 'media',    required: false },
    { name: 'blocks',         label: 'Page Blocks',        type: 'blocks',   required: false },
  ],
};

/**
 * Every system schema upserted by the API on startup.
 * Add new entries here to register additional system schemas.
 */
export const SYSTEM_SCHEMAS: SystemSchema[] = [
  PAGE_SCHEMA_DEFINITION,
  MEDIA_SCHEMA_DEFINITION,
];

// ── Block registry bootstrap ─────────────────────────────────────────────────

/**
 * Registers all built-in block definitions in the shared registry.
 * Idempotent: safe to call multiple times.
 * Call once on application startup (admin, mobile).
 */
export function registerBuiltInBlocks(): void {
  if (blockRegistry.get('heading')) return;
  for (const def of BUILT_IN_BLOCK_DEFINITIONS) {
    blockRegistry.register(def);
  }
}

// ── Settings registry ────────────────────────────────────────────────────────
//
// Tier 1 (system) settings: declared in code, stable keys, typed.
// API validates writes against this registry; admin renders forms from it.
// Add a new setting = add one entry below.

export type SettingScope = 'global' | 'client' | 'schema' | 'page';
export type SettingSchemaView = 'single' | 'archive' | 'both';
export type SettingType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'color'
  | 'select'
  | 'media'
  | 'page';

export interface SettingDefinition {
  key: string;                       // unique within (scope, schemaView)
  label: string;
  description?: string;
  category: string;                  // groups settings in the admin UI
  type: SettingType;
  options?: string[];                // for type === 'select'
  defaultValue?: unknown;
  scope: SettingScope;
  schemaView?: SettingSchemaView;    // only when scope === 'schema'
  isPublic: boolean;                 // exposed via /settings/public
}

export const SETTINGS_REGISTRY: SettingDefinition[] = [
  {
    key: 'site.name',
    label: 'Site Name',
    category: 'General',
    type: 'text',
    defaultValue: 'My Site',
    scope: 'global',
    isPublic: true,
  },
  {
    key: 'client.theme.logo',
    label: 'Logo',
    description: 'Logo image displayed in the header.',
    category: 'Branding',
    type: 'media',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.brandName',
    label: 'Brand Name',
    category: 'Branding',
    type: 'text',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.homePage',
    label: 'Home Page',
    description: 'Page entry id served as the home page for this client.',
    category: 'General',
    type: 'page',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.primaryColor',
    label: 'Primary Color',
    category: 'Theme',
    type: 'color',
    defaultValue: '#3B82F6',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.secondaryColor',
    label: 'Secondary Color',
    category: 'Theme',
    type: 'color',
    defaultValue: '#6366F1',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.accentColor',
    label: 'Accent Color',
    category: 'Theme',
    type: 'color',
    defaultValue: '#EC4899',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.backgroundColor',
    label: 'Background Color',
    category: 'Theme',
    type: 'color',
    defaultValue: '#FFFFFF',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.textColor',
    label: 'Text Color',
    category: 'Theme',
    type: 'color',
    defaultValue: '#1F2937',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.borderColor',
    label: 'Border Color',
    category: 'Theme',
    type: 'color',
    defaultValue: '#E5E7EB',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.borderRadius',
    label: 'Border Radius (px)',
    description: 'Default border radius in pixels for rounded corners.',
    category: 'Theme',
    type: 'number',
    defaultValue: 8,
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.headerBg',
    label: 'Header Background',
    description: 'Background color for the top navigation header.',
    category: 'Theme',
    type: 'color',
    defaultValue: '#3B82F6',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.footerBg',
    label: 'Footer Background',
    description: 'Background color for the footer.',
    category: 'Theme',
    type: 'color',
    defaultValue: '#1F2937',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.footerTextColor',
    label: 'Footer Text Color',
    description: 'Text color for footer content.',
    category: 'Theme',
    type: 'color',
    defaultValue: '#FFFFFF',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.menuBg',
    label: 'Menu Background',
    description: 'Background color for menu navigation bar.',
    category: 'Theme',
    type: 'color',
    defaultValue: '#FFFFFF',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.headerTextColor',
    label: 'Header Text Color',
    description: 'Text color for the header and navigation links.',
    category: 'Theme',
    type: 'color',
    defaultValue: '#1F2937',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.drawerBg',
    label: 'Drawer Background',
    description: 'Background color for the sidebar drawer.',
    category: 'Theme',
    type: 'color',
    defaultValue: '#1F2937',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.drawerText',
    label: 'Drawer Text Color',
    description: 'Text color for sidebar drawer items.',
    category: 'Theme',
    type: 'color',
    defaultValue: '#d4d4d8',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.drawerActive',
    label: 'Drawer Active Background',
    description: 'Background color for the active sidebar drawer item.',
    category: 'Theme',
    type: 'color',
    defaultValue: '#374151',
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'client.theme.borderWidth',
    label: 'Border Width (px)',
    description: 'Default border width in pixels.',
    category: 'Theme',
    type: 'number',
    defaultValue: 1,
    scope: 'client',
    isPublic: true,
  },
  {
    key: 'archive.itemsPerPage',
    label: 'Items per Page',
    category: 'Archive',
    type: 'number',
    defaultValue: 10,
    scope: 'schema',
    schemaView: 'archive',
    isPublic: true,
  },
  {
    key: 'page.heroOverlay',
    label: 'Hero Overlay Color',
    category: 'Appearance',
    type: 'color',
    defaultValue: '#00000080',
    scope: 'page',
    isPublic: true,
  },
];

/**
 * Lookup a setting definition by (scope, key, schemaView).
 * Returns undefined if no such setting is registered.
 */
export function findSettingDefinition(
  scope: SettingScope,
  key: string,
  schemaView?: SettingSchemaView,
): SettingDefinition | undefined {
  return SETTINGS_REGISTRY.find(d =>
    d.scope === scope &&
    d.key === key &&
    (scope !== 'schema' || matchesSchemaView(d.schemaView, schemaView)),
  );
}

function matchesSchemaView(
  defView: SettingSchemaView | undefined,
  reqView: SettingSchemaView | undefined,
): boolean {
  if (!defView || defView === 'both') return true;
  return defView === reqView;
}
