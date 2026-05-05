'use client';

import { ReactNode, useState, useEffect } from 'react';
import Select from 'react-select';
import { BlockSchemaField, Block, ColumnBlock } from '@research-cms/shared-types';
import { getAllSchemas, getAllEntries } from '@/app/actions';
import { NestedBlocksEditor } from './NestedBlocksEditor';
import { ColumnsEditor } from './ColumnsEditor';
import { Text, Toggle } from '@/components/ui';

interface SelectOption {
  value: string;
  label: string;
}

const compactInput = 'w-full border-2 border-on-surface bg-surface px-2 py-1 font-code text-caption text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';

const compactSelectStyles = {
  control: (base: any) => ({ ...base, minHeight: 32, fontSize: 12, fontFamily: 'ui-monospace, monospace', borderColor: '#000', borderWidth: 2, borderRadius: 0, boxShadow: 'none', '&:hover': { borderColor: '#000' } }),
  menu: (base: any) => ({ ...base, fontSize: 12, fontFamily: 'ui-monospace, monospace', borderRadius: 0, zIndex: 30, border: '2px solid #000', boxShadow: '4px 4px 0 #000' }),
  option: (base: any, s: any) => ({ ...base, backgroundColor: s.isFocused ? '#f4f4f5' : 'white', color: '#000', fontSize: 12 }),
  multiValue: (base: any) => ({ ...base, backgroundColor: '#f4f4f5', borderRadius: 0, border: '1px solid #000' }),
  multiValueLabel: (base: any) => ({ ...base, fontSize: 11, fontFamily: 'ui-monospace, monospace' }),
};

function FieldLabel({ field }: { field: BlockSchemaField }) {
  return (
    <Text variant="caption" color="secondary" as="label" className="block mb-0.5 font-code">
      {field.label}
      {field.required && <span className="text-error ml-1">*</span>}
    </Text>
  );
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
  const label = <FieldLabel field={field} />;

  switch (field.type) {
    case 'text':
      return (
        <div>
          {label}
          <input
            type="text"
            className={compactInput}
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
            className={`${compactInput} resize-y`}
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
            className={compactInput}
            placeholder={field.description || ''}
            value={typeof value === 'number' ? value : ''}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
            disabled={disabled}
          />
        </div>
      );

    case 'boolean':
      return (
        <div className="py-0.5">
          <Toggle
            checked={Boolean(value)}
            onChange={e => onChange(e)}
            disabled={disabled}
            label={field.label}
            ariaLabel={field.label}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          {label}
          <select
            className={compactInput}
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
              className={`${compactInput} h-8 w-12 cursor-pointer p-0`}
              value={String(value ?? '#000000')}
              onChange={e => onChange(e.target.value)}
              disabled={disabled}
            />
            <input
              type="text"
              className={`${compactInput} flex-1`}
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
            className={compactInput}
            placeholder="https://example.com/image.png"
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value || undefined)}
            disabled={disabled}
          />
          {value ? (
            <div className="mt-2 border-2 border-on-surface overflow-hidden">
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
          onChange={onChange as (blocks: Block[]) => void}
          label={field.label}
        />
      );

    case 'columns':
      return (
        <ColumnsEditor
          columns={(value as ColumnBlock[]) ?? []}
          onChange={onChange as (cols: ColumnBlock[]) => void}
        />
      );

    default:
      return (
        <div className="p-2 bg-surface border-2 border-error">
          <Text variant="caption" color="error">Unknown field type: {(field as any).type}</Text>
        </div>
      );
  }
}

// ── Sub-components ────────────────────────────────────────────────────────

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
          className={compactInput}
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
        className={compactInput}
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
          className={compactInput}
          placeholder="https://…"
          value={current.url ?? ''}
          onChange={e => onChange({ ...current, url: e.target.value })}
          disabled={disabled}
        />
      )}
      {current.type === 'navigate' && (
        <input
          type="text"
          className={compactInput}
          placeholder="page-slug"
          value={current.pageSlug ?? ''}
          onChange={e => onChange({ ...current, pageSlug: e.target.value })}
          disabled={disabled}
        />
      )}
      {current.type === 'schema' && (
        <input
          type="text"
          className={compactInput}
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
            className={compactInput}
            placeholder="schema-slug"
            value={current.schemaSlug ?? ''}
            onChange={e => onChange({ ...current, schemaSlug: e.target.value })}
            disabled={disabled}
          />
          <input
            type="text"
            className={compactInput}
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
        styles={compactSelectStyles}
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

  return (
    <div>
      {label}
      {!schemaSlug ? (
        <div className="p-2 bg-surface-container border-2 border-on-surface">
          <Text variant="caption" color="secondary">Select a schema first</Text>
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
          styles={compactSelectStyles}
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

  return (
    <div>
      {label}
      {!schemaSlug ? (
        <div className="p-2 bg-surface-container border-2 border-on-surface">
          <Text variant="caption" color="secondary">Select a schema first</Text>
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
          styles={compactSelectStyles}
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

  const selectedValues = Array.isArray(value) ? value : [];
  const selectedOptions = selectedValues
    .map(v => fields.find(f => f.value === v))
    .filter((f): f is SelectOption => f !== undefined);

  return (
    <div>
      {label}
      {!schemaSlug ? (
        <div className="p-2 bg-surface-container border-2 border-on-surface">
          <Text variant="caption" color="secondary">Select a schema first</Text>
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
          styles={compactSelectStyles}
        />
      )}
    </div>
  );
}
