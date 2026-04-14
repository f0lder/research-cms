/**
 * Built-in block definitions.
 * Each definition is registered once at module load time.
 * Use this in: api/src/main.ts, admin on startup, mobile on startup.
 */
import {
  blockRegistry,
  BlockDefinition,
  BlockResolveContext,
  HeadingBlock,
  TextBlock,
  DividerBlock,
  SpacerBlock,
  ImageBlock,
  ButtonBlock,
  FieldBlock,
  ArchiveBlock,
  EntryBlock,
  RowBlock,
  ColumnBlock,
  CardBlock,
} from './types';

// ── Static Blocks ────────────────────────────────────────────────────────────

const headingDefinition: BlockDefinition<HeadingBlock> = {
  type: 'heading',
  label: 'Heading',
  icon: 'heading',
  category: 'static',
  description: 'A title or section heading',

  schema: {
    fields: [
      {
        name: 'text',
        label: 'Text',
        type: 'text',
        required: true,
      },
      {
        name: 'level',
        label: 'Level',
        type: 'select',
        options: ['1', '2', '3', '4'],
        defaultValue: '2',
      },
      {
        name: 'align',
        label: 'Alignment',
        type: 'select',
        options: ['left', 'center', 'right'],
        defaultValue: 'left',
      },
      {
        name: 'color',
        label: 'Color',
        type: 'color',
      },
      {
        name: 'fontWeight',
        label: 'Weight',
        type: 'select',
        options: ['normal', 'semibold', 'bold'],
        defaultValue: 'normal',
      },
    ],
  },

  defaultConfig: () => ({
    text: 'New Heading',
    level: 2,
    align: 'left',
  }),
};

const textDefinition: BlockDefinition<TextBlock> = {
  type: 'text',
  label: 'Paragraph',
  icon: 'text',
  category: 'static',
  description: 'Body text or rich content',

  schema: {
    fields: [
      {
        name: 'content',
        label: 'Text',
        type: 'textarea',
        required: true,
      },
      {
        name: 'align',
        label: 'Alignment',
        type: 'select',
        options: ['left', 'center', 'right', 'justify'],
        defaultValue: 'left',
      },
      {
        name: 'color',
        label: 'Color',
        type: 'color',
      },
      {
        name: 'fontSize',
        label: 'Size',
        type: 'select',
        options: ['sm', 'base', 'lg', 'xl'],
        defaultValue: 'base',
      },
    ],
  },

  defaultConfig: () => ({
    content: 'Your text here…',
    align: 'left',
  }),
};

const dividerDefinition: BlockDefinition<DividerBlock> = {
  type: 'divider',
  label: 'Divider',
  icon: 'divider',
  category: 'static',
  description: 'Visual separator line',

  schema: {
    fields: [
      {
        name: 'color',
        label: 'Color',
        type: 'color',
        defaultValue: '#e4e4e7',
      },
      {
        name: 'thickness',
        label: 'Thickness (px)',
        type: 'number',
        defaultValue: 1,
      },
      {
        name: 'style',
        label: 'Style',
        type: 'select',
        options: ['solid', 'dashed', 'dotted'],
        defaultValue: 'solid',
      },
    ],
  },

  defaultConfig: () => ({
    color: '#e4e4e7',
    thickness: 1,
    style: 'solid',
  }),
};

const spacerDefinition: BlockDefinition<SpacerBlock> = {
  type: 'spacer',
  label: 'Spacer',
  icon: 'spacer',
  category: 'static',
  description: 'Vertical spacing',

  schema: {
    fields: [
      {
        name: 'height',
        label: 'Height (px)',
        type: 'number',
        defaultValue: 24,
        required: true,
      },
    ],
  },

  defaultConfig: () => ({
    height: 24,
  }),
};

const imageDefinition: BlockDefinition<ImageBlock> = {
  type: 'image',
  label: 'Image',
  icon: 'image',
  category: 'static',
  description: 'Embed an image from media library',

  schema: {
    fields: [
      {
        name: 'mediaId',
        label: 'Media',
        type: 'entry-picker',
        schemaSlug: 'media',  // Reference to media schema
        required: true,
      },
      {
        name: 'alt',
        label: 'Alt Text',
        type: 'text',
      },
      {
        name: 'width',
        label: 'Width',
        type: 'select',
        options: ['auto', 'full'],
        defaultValue: 'full',
      },
      {
        name: 'height',
        label: 'Height',
        type: 'number',
      },
      {
        name: 'fit',
        label: 'Fit',
        type: 'select',
        options: ['cover', 'contain', 'fill'],
        defaultValue: 'cover',
      },
      {
        name: 'linkUrl',
        label: 'Link URL (optional)',
        type: 'text',
      },
    ],
  },

  defaultConfig: () => ({
    mediaId: '',
    width: 'full',
    fit: 'cover',
  }),
};

const buttonDefinition: BlockDefinition<ButtonBlock> = {
  type: 'button',
  label: 'Button',
  icon: 'button',
  category: 'static',
  description: 'Interactive button with action',

  schema: {
    fields: [
      {
        name: 'label',
        label: 'Label',
        type: 'text',
        required: true,
      },
      {
        name: 'action',
        label: 'Action',
        type: 'action-picker',
        required: true,
      },
      {
        name: 'variant',
        label: 'Style',
        type: 'select',
        options: ['primary', 'secondary', 'outline', 'ghost'],
        defaultValue: 'primary',
      },
      {
        name: 'align',
        label: 'Alignment',
        type: 'select',
        options: ['left', 'center', 'right', 'full'],
        defaultValue: 'center',
      },
    ],
  },

  defaultConfig: () => ({
    label: 'Click me',
    action: { type: 'url', url: '' },
    variant: 'primary',
    align: 'center',
  }),
};

// ── Content Blocks ──────────────────────────────────────────────────────────

const archiveDefinition: BlockDefinition<ArchiveBlock> = {
  type: 'archive',
  label: 'Archive (List)',
  icon: 'archive',
  category: 'content',
  description: 'Display a list of entries from a schema',

  schema: {
    fields: [
      {
        name: 'schemaSlug',
        label: 'Schema',
        type: 'schema-picker',
        required: true,
      },
      {
        name: 'title',
        label: 'Section Title',
        type: 'text',
      },
      {
        name: 'limit',
        label: 'Max Items',
        type: 'number',
        defaultValue: 5,
      },
      {
        name: 'orderBy',
        label: 'Order By',
        type: 'field-picker',
      },
      {
        name: 'orderDir',
        label: 'Direction',
        type: 'select',
        options: ['asc', 'desc'],
        defaultValue: 'desc',
      },
      {
        name: 'layout',
        label: 'Layout',
        type: 'select',
        options: ['list', 'grid', 'carousel'],
        defaultValue: 'list',
      },
      {
        name: 'columns',
        label: 'Columns',
        type: 'select',
        options: ['1', '2', '3'],
        defaultValue: '1',
      },
      {
        name: 'emptyMessage',
        label: 'Empty Message',
        type: 'text',
        defaultValue: 'No items found',
      },
    ],
  },

  defaultConfig: () => ({
    schemaSlug: '',
    limit: 5,
    orderDir: 'desc',
    layout: 'list',
    columns: 1,
    emptyMessage: 'No items found',
  }),

  // Resolved server-side — handled by pages.service.resolveArchiveBlock()
  // No resolve function in shared-types; resolution happens in the API layer
};

const entryDefinition: BlockDefinition<EntryBlock> = {
  type: 'entry',
  label: 'Entry (Single)',
  icon: 'entry',
  category: 'content',
  description: 'Display a single entry from a schema',

  schema: {
    fields: [
      {
        name: 'schemaSlug',
        label: 'Schema',
        type: 'schema-picker',
        required: true,
      },
      {
        name: 'entryId',
        label: 'Entry',
        type: 'entry-picker',
        required: true,
      },
      {
        name: 'showFields',
        label: 'Show Fields',
        type: 'field-picker-multi',
      },
    ],
  },

  defaultConfig: () => ({
    schemaSlug: '',
    entryId: '',
  }),

  // Resolved server-side — handled by pages.service.resolveEntryBlock()
};

const fieldDefinition: BlockDefinition<FieldBlock> = {
  type: 'field',
  label: 'Field',
  icon: 'field',
  category: 'content',
  description: 'Display a single field from the current entry',

  schema: {
    fields: [
      {
        name: 'fieldName',
        label: 'Field',
        type: 'field-picker',
        required: true,
      },
      {
        name: 'label',
        label: 'Label',
        type: 'text',
      },
      {
        name: 'showLabel',
        label: 'Show Label',
        type: 'boolean',
        defaultValue: true,
      },
      {
        name: 'labelPosition',
        label: 'Label Position',
        type: 'select',
        options: ['above', 'inline', 'hidden'],
        defaultValue: 'above',
      },
    ],
  },

  defaultConfig: () => ({
    fieldName: '',
    label: '',
    fieldType: 'text' as any,
    showLabel: true,
    labelPosition: 'above',
    value: null,
  }),
};

// ── Layout Blocks ────────────────────────────────────────────────────────────

const rowDefinition: BlockDefinition<RowBlock> = {
  type: 'row',
  label: 'Row',
  icon: 'row',
  category: 'layout',
  description: 'Horizontal layout container',

  schema: {
    fields: [
      {
        name: 'columns',
        label: 'Columns',
        type: 'columns',
      },
      {
        name: 'gap',
        label: 'Gap (px)',
        type: 'number',
        defaultValue: 16,
      },
      {
        name: 'align',
        label: 'Alignment',
        type: 'select',
        options: ['start', 'center', 'end', 'stretch'],
        defaultValue: 'stretch',
      },
      {
        name: 'wrap',
        label: 'Wrap',
        type: 'boolean',
        defaultValue: false,
      },
    ],
  },

  defaultConfig: () => ({
    columns: [],
    gap: 16,
    align: 'stretch',
    wrap: false,
  }),

  // Resolved server-side — handled by pages.service.resolveRowBlock()
};

const columnDefinition: BlockDefinition<ColumnBlock> = {
  type: 'column',
  label: 'Column',
  icon: 'column',
  category: 'layout',
  description: 'Vertical layout container',

  schema: {
    fields: [
      {
        name: 'width',
        label: 'Width',
        type: 'select',
        options: ['auto', 'full'],
        defaultValue: 'auto',
      },
      {
        name: 'blocks',
        label: 'Blocks',
        type: 'blocks',
      },
    ],
  },

  defaultConfig: () => ({
    blocks: [],
    width: 'auto',
  }),
};

const cardDefinition: BlockDefinition<CardBlock> = {
  type: 'card',
  label: 'Card',
  icon: 'card',
  category: 'layout',
  description: 'Card container with optional tap action',

  schema: {
    fields: [
      {
        name: 'elevation',
        label: 'Shadow',
        type: 'number',
        defaultValue: 1,
      },
      {
        name: 'pressAction',
        label: 'Tap Action',
        type: 'action-picker',
      },
      {
        name: 'blocks',
        label: 'Blocks',
        type: 'blocks',
      },
    ],
  },

  defaultConfig: () => ({
    blocks: [],
    elevation: 1,
  }),

  // Resolved server-side — handled by pages.service.resolveCardBlock()
}

// ── Register all built-in blocks ───────────────────────────────────────────

/**
 * Call this function once at application startup.
 * Registers all built-in block definitions in the shared registry.
 */
export function registerBuiltInBlocks(): void {
  // Idempotent: only register if not already registered
  if (blockRegistry.get('heading')) return;

  // Static
  blockRegistry.register(headingDefinition);
  blockRegistry.register(textDefinition);
  blockRegistry.register(dividerDefinition);
  blockRegistry.register(spacerDefinition);
  blockRegistry.register(imageDefinition);
  blockRegistry.register(buttonDefinition);

  // Content
  blockRegistry.register(archiveDefinition);
  blockRegistry.register(entryDefinition);
  blockRegistry.register(fieldDefinition);

  // Layout
  blockRegistry.register(rowDefinition);
  blockRegistry.register(columnDefinition);
  blockRegistry.register(cardDefinition);
}
