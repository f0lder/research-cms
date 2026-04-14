'use client';

import { ReactNode, useState, useEffect } from 'react';
import Select from 'react-select';
import { BlockSchemaField, Block, ColumnBlock, ContentTypeDefinition } from '@research-cms/shared-types';
import { getAllSchemas, getAllEntries } from '@/app/actions';
import { NestedBlocksEditor } from './NestedBlocksEditor';
import { ColumnsEditor } from './ColumnsEditor';

interface SelectOption {
  value: string;
  label: string;
}

/**
 * Generic form field renderer that handles any BlockSchemaField type.
 * Maps field type to appropriate UI component.
 * This component is the heart of the registry pattern in the admin UI —
 * adding a new field type doesn't require changes to block-specific editors.
 */
export function SchemaFieldInput({
  field,
  value,
  onChange,
  disabled = false,
  options,
  block,
  contextSchemaSlug,
}: {
  field: BlockSchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  options?: { label: string; value: string }[];
  block?: Block;
  contextSchemaSlug?: string;
}): ReactNode {
  const label = (
    <label className="text-[9px] text-zinc-400 font-mono block mb-0.5">
      {field.label}
      {field.required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );

  switch (field.type) {
    case 'text':
      return (
        <div>
          {label}
          <input
            type="text"
            className="field-input w-full text-xs py-1"
            placeholder={field.description || ''}
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value || undefined)}
            disabled={disabled}
          />
        </div>
      );

    case 'textarea':
      return (
        <div>
          {label}
          <textarea
            className="field-input w-full text-xs resize-y py-1"
            rows={2}
            placeholder={field.description || ''}
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value || undefined)}
            disabled={disabled}
          />
        </div>
      );

    case 'number':
      return (
        <div>
          {label}
          <input
            type="number"
            className="field-input w-full text-xs py-1"
            placeholder={field.description || ''}
            value={typeof value === 'number' ? value : ''}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
            disabled={disabled}
          />
        </div>
      );

    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer py-0.5">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={e => onChange(e.target.checked)}
            disabled={disabled}
            className="w-3 h-3"
          />
          <span className="text-[9px] text-zinc-400 font-mono">{field.label}</span>
        </label>
      );

    case 'select':
      return (
        <div>
          {label}
          <select
            className="field-input w-full text-xs py-1"
            value={String(value ?? (field.defaultValue ?? ''))}
            onChange={e => onChange(e.target.value || undefined)}
            disabled={disabled}
          >
            <option value="">— Select —</option>
            {(field.options ?? []).map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );

    case 'color':
      return (
        <div>
          {label}
          <div className="flex gap-1">
            <input
              type="color"
              className="field-input h-8 w-12 cursor-pointer"
              value={String(value ?? '#000000')}
              onChange={e => onChange(e.target.value)}
              disabled={disabled}
            />
            <input
              type="text"
              className="field-input flex-1 text-xs font-mono py-1"
              value={String(value ?? '')}
              onChange={e => onChange(e.target.value || undefined)}
              disabled={disabled}
              placeholder="#000000"
            />
          </div>
        </div>
      );

    case 'image-url':
      return (
        <div>
          {label}
          <input
            type="text"
            className="field-input w-full text-xs py-1"
            placeholder="https://example.com/image.png"
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value || undefined)}
            disabled={disabled}
          />
          {value ? (
            <div className="mt-2 rounded border border-zinc-200 overflow-hidden">
              <img
                src={String(value)}
                alt="Preview"
                className="w-full h-32 object-cover"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            </div>
          ) : null}
        </div>
      );

    case 'spacing':
      return (
        <div>
          {label}
          <SpacingInput value={value} onChange={onChange} disabled={disabled} />
        </div>
      );

    case 'schema-picker':
      return (
        <SchemaPickerSelect
          label={label}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'field-picker':
      return (
        <FieldPickerSelect
          label={label}
          value={value}
          onChange={onChange}
          disabled={disabled}
          schemaSlug={contextSchemaSlug || (block ? (block as any).schemaSlug : undefined)}
        />
      );

    case 'field-picker-multi':
      return (
        <FieldPickerMultiSelect
          label={label}
          value={value}
          onChange={onChange}
          disabled={disabled}
          schemaSlug={contextSchemaSlug || (block ? (block as any).schemaSlug : undefined)}
        />
      );

    case 'entry-picker':
      return (
        <EntryPickerSelect
          label={label}
          value={value}
          onChange={onChange}
          disabled={disabled}
          schemaSlug={field.schemaSlug || contextSchemaSlug || (block ? (block as any).schemaSlug : undefined)}
        />
      );

    case 'action-picker':
      return (
        <div>
          {label}
          <ActionPickerInput value={value} onChange={onChange} disabled={disabled} />
        </div>
      );

    case 'blocks':
      return (
        <NestedBlocksEditor
          blocks={(value as Block[]) ?? []}
          onChange={onChange}
          label={typeof label === 'string' ? label : 'Nested Blocks'}
        />
      );

    case 'columns':
      return (
        <ColumnsEditor
          columns={(value as ColumnBlock[]) ?? []}
          onChange={onChange}
        />
      );

    default:
      return (
        <div className="text-[11px] text-red-500 p-2 bg-red-50 border border-red-200 rounded">
          Unknown field type: {field.type}
        </div>
      );
  }
}

// ── Sub-components ────────────────────────────────────────────────────────

/**
 * Spacing editor for padding/margin.
 * Allows setting top, right, bottom, left individually.
 */
function SpacingInput({
  value,
  onChange,
  disabled,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}) {
  const current = (value as any) ?? {};

  return (
    <div className="grid grid-cols-4 gap-1">
      {['top', 'right', 'bottom', 'left'].map(side => (
        <input
          key={side}
          type="number"
          className="field-input w-full text-xs py-1"
          placeholder={side[0].toUpperCase()}
          title={side}
          value={current[side] ?? ''}
          onChange={e => {
            const num = e.target.value ? Number(e.target.value) : undefined;
            onChange({ ...current, [side]: num });
          }}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

/**
 * Action picker for ButtonBlock actions.
 * Handles: navigate, url, schema, entry.
 */
function ActionPickerInput({
  value,
  onChange,
  disabled,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}) {
  const current = (value as any) ?? { type: 'url', url: '' };

  return (
    <div className="flex flex-col gap-1">
      <select
        className="field-input w-full text-xs py-1"
        value={current.type ?? 'url'}
        onChange={e => {
          const type = e.target.value;
          let newAction: any = { type: 'url', url: '' };
          if (type === 'navigate') newAction = { type: 'navigate', pageSlug: '' };
          else if (type === 'schema') newAction = { type: 'schema', schemaSlug: '' };
          else if (type === 'entry') newAction = { type: 'entry', schemaSlug: '', entryId: '' };
          onChange(newAction);
        }}
        disabled={disabled}
      >
        <option value="url">URL</option>
        <option value="navigate">Navigate to page</option>
        <option value="schema">Navigate to schema</option>
        <option value="entry">Navigate to entry</option>
      </select>

      {current.type === 'url' && (
        <input
          type="text"
          className="field-input w-full text-xs py-1"
          placeholder="https://…"
          value={current.url ?? ''}
          onChange={e => onChange({ ...current, url: e.target.value })}
          disabled={disabled}
        />
      )}
      {current.type === 'navigate' && (
        <input
          type="text"
          className="field-input w-full text-xs py-1"
          placeholder="page-slug"
          value={current.pageSlug ?? ''}
          onChange={e => onChange({ ...current, pageSlug: e.target.value })}
          disabled={disabled}
        />
      )}
      {current.type === 'schema' && (
        <input
          type="text"
          className="field-input w-full text-xs py-1"
          placeholder="schema-slug"
          value={current.schemaSlug ?? ''}
          onChange={e => onChange({ ...current, schemaSlug: e.target.value })}
          disabled={disabled}
        />
      )}
      {current.type === 'entry' && (
        <>
          <input
            type="text"
            className="field-input w-full text-xs py-1"
            placeholder="schema-slug"
            value={current.schemaSlug ?? ''}
            onChange={e => onChange({ ...current, schemaSlug: e.target.value })}
            disabled={disabled}
          />
          <input
            type="text"
            className="field-input w-full text-xs py-1"
            placeholder="entry-id"
            value={current.entryId ?? ''}
            onChange={e => onChange({ ...current, entryId: e.target.value })}
            disabled={disabled}
          />
        </>
      )}
    </div>
  );
}

// ── Schema Picker ────────────────────────────────────────────────────────

function SchemaPickerSelect({
  label,
  value,
  onChange,
  disabled,
}: {
  label: ReactNode;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}) {
  const [schemas, setSchemas] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAllSchemas()
      .then(res => {
        if (res.data) {
          setSchemas(res.data.map(s => ({ value: s.slug, label: s.name })));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const reactSelectStyles = {
    control: (base: any) => ({ ...base, minHeight: 28, fontSize: 11, fontFamily: 'monospace', borderColor: '#e4e4e7', borderRadius: 2, boxShadow: 'none' }),
    menu: (base: any) => ({ ...base, fontSize: 11, fontFamily: 'monospace', borderRadius: 2, zIndex: 30 }),
    option: (base: any, s: any) => ({ ...base, backgroundColor: s.isFocused ? '#f4f4f5' : 'white', color: '#18181b', fontSize: 11 }),
  };

  return (
    <div>
      {label}
      <Select<SelectOption>
        options={schemas}
        value={schemas.find(s => s.value === value) ?? null}
        onChange={opt => onChange(opt?.value ?? undefined)}
        isLoading={loading}
        isDisabled={disabled}
        placeholder="Select schema…"
        classNamePrefix="rs"
        styles={reactSelectStyles}
      />
    </div>
  );
}

// ── Field Picker ────────────────────────────────────────────────────────

function FieldPickerSelect({
  label,
  value,
  onChange,
  disabled,
  schemaSlug,
}: {
  label: ReactNode;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  schemaSlug?: string;
}) {
  const [fields, setFields] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schemaSlug) {
      setFields([]);
      return;
    }

    setLoading(true);
    getAllSchemas()
      .then(res => {
        if (res.data) {
          const schema = res.data.find(s => s.slug === schemaSlug);
          if (schema) {
            setFields(schema.fields.map(f => ({ value: f.name, label: f.label })));
          }
        }
      })
      .finally(() => setLoading(false));
  }, [schemaSlug]);

  const reactSelectStyles = {
    control: (base: any) => ({ ...base, minHeight: 28, fontSize: 11, fontFamily: 'monospace', borderColor: '#e4e4e7', borderRadius: 2, boxShadow: 'none' }),
    menu: (base: any) => ({ ...base, fontSize: 11, fontFamily: 'monospace', borderRadius: 2, zIndex: 30 }),
    option: (base: any, s: any) => ({ ...base, backgroundColor: s.isFocused ? '#f4f4f5' : 'white', color: '#18181b', fontSize: 11 }),
  };

  return (
    <div>
      {label}
      {!schemaSlug ? (
        <div className="text-[9px] text-zinc-400 p-2 bg-zinc-50 border border-zinc-200 rounded">
          Select a schema first
        </div>
      ) : (
        <Select<SelectOption>
          options={fields}
          value={fields.find(f => f.value === value) ?? null}
          onChange={opt => onChange(opt?.value ?? undefined)}
          isLoading={loading}
          isDisabled={disabled || !schemaSlug}
          placeholder="Select field…"
          classNamePrefix="rs"
          styles={reactSelectStyles}
        />
      )}
    </div>
  );
}

// ── Entry Picker ────────────────────────────────────────────────────────

function EntryPickerSelect({
  label,
  value,
  onChange,
  disabled,
  schemaSlug,
}: {
  label: ReactNode;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  schemaSlug?: string;
}) {
  const [entries, setEntries] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schemaSlug) {
      setEntries([]);
      return;
    }

    setLoading(true);
    getAllEntries(schemaSlug)
      .then(res => {
        if (res.data?.items) {
          setEntries(
            res.data.items.map(e => ({
              value: e._id ?? '',
              label: (e.data?.title as string) || e._id || 'Untitled',
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, [schemaSlug]);

  const reactSelectStyles = {
    control: (base: any) => ({ ...base, minHeight: 28, fontSize: 11, fontFamily: 'monospace', borderColor: '#e4e4e7', borderRadius: 2, boxShadow: 'none' }),
    menu: (base: any) => ({ ...base, fontSize: 11, fontFamily: 'monospace', borderRadius: 2, zIndex: 30 }),
    option: (base: any, s: any) => ({ ...base, backgroundColor: s.isFocused ? '#f4f4f5' : 'white', color: '#18181b', fontSize: 11 }),
  };

  return (
    <div>
      {label}
      {!schemaSlug ? (
        <div className="text-[9px] text-zinc-400 p-2 bg-zinc-50 border border-zinc-200 rounded">
          Select a schema first
        </div>
      ) : (
        <Select<SelectOption>
          options={entries}
          value={entries.find(e => e.value === value) ?? null}
          onChange={opt => onChange(opt?.value ?? undefined)}
          isLoading={loading}
          isDisabled={disabled || !schemaSlug}
          placeholder="Select entry…"
          classNamePrefix="rs"
          styles={reactSelectStyles}
        />
      )}
    </div>
  );
}

// ── Field Picker Multi (Multi-Select) ─────────────────────────────────────

function FieldPickerMultiSelect({
  label,
  value,
  onChange,
  disabled,
  schemaSlug,
}: {
  label: ReactNode;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  schemaSlug?: string;
}) {
  const [fields, setFields] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schemaSlug) {
      setFields([]);
      return;
    }

    setLoading(true);
    getAllSchemas()
      .then(res => {
        if (res.data) {
          const schema = res.data.find(s => s.slug === schemaSlug);
          if (schema) {
            setFields(schema.fields.map(f => ({ value: f.name, label: f.label })));
          }
        }
      })
      .finally(() => setLoading(false));
  }, [schemaSlug]);

  const reactSelectStyles = {
    control: (base: any) => ({ ...base, minHeight: 28, fontSize: 11, fontFamily: 'monospace', borderColor: '#e4e4e7', borderRadius: 2, boxShadow: 'none' }),
    menu: (base: any) => ({ ...base, fontSize: 11, fontFamily: 'monospace', borderRadius: 2, zIndex: 30 }),
    option: (base: any, s: any) => ({ ...base, backgroundColor: s.isFocused ? '#f4f4f5' : 'white', color: '#18181b', fontSize: 11 }),
  };

  const selectedValues = Array.isArray(value) ? value : [];
  const selectedOptions = selectedValues
    .map(v => fields.find(f => f.value === v))
    .filter((f): f is SelectOption => f !== undefined);

  return (
    <div>
      {label}
      {!schemaSlug ? (
        <div className="text-[9px] text-zinc-400 p-2 bg-zinc-50 border border-zinc-200 rounded">
          Select a schema first
        </div>
      ) : (
        <Select<SelectOption, true>
          isMulti
          options={fields}
          value={selectedOptions}
          onChange={opts => onChange(opts ? opts.map(o => o.value) : [])}
          isLoading={loading}
          isDisabled={disabled || !schemaSlug}
          placeholder="Select fields… (empty = all fields)"
          classNamePrefix="rs"
          styles={reactSelectStyles}
        />
      )}
    </div>
  );
}
