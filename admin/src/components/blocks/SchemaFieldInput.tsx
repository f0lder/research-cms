'use client';

import { ReactNode } from 'react';
import { BlockSchemaField, Block, ColumnBlock } from '@research-cms/shared-types';
import { NestedBlocksEditor } from './NestedBlocksEditor';
import { ColumnsEditor } from './ColumnsEditor';
import { Text, Toggle, PagePickerSelect, SchemaPickerSelect, EntryPickerSelect, FieldPickerSelect, FieldPickerMultiSelect } from '@/components/ui';

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
  clientId,
}: {
  field: BlockSchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  options?: { label: string; value: string }[];
  block?: Block;
  contextSchemaSlug?: string;
  clientId?: string;
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
          <ActionPickerInput value={value} onChange={onChange} disabled={disabled} clientId={clientId} />
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
  clientId,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  clientId?: string;
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
        <PagePickerSelect
          label={null}
          value={current.pageSlug}
          onChange={val => onChange({ ...current, pageSlug: val })}
          disabled={disabled}
          clientId={clientId}
        />
      )}
      {current.type === 'schema' && (
        <SchemaPickerSelect
          label={null}
          value={current.schemaSlug}
          onChange={val => onChange({ ...current, schemaSlug: val })}
          disabled={disabled}
        />
      )}
      {current.type === 'entry' && (
        <div className="flex flex-col gap-1">
          <SchemaPickerSelect
            label={null}
            value={current.schemaSlug}
            onChange={val => onChange({ ...current, schemaSlug: val, entryId: '' })}
            disabled={disabled}
          />
          {current.schemaSlug && (
            <EntryPickerSelect
              label={null}
              value={current.entryId}
              onChange={val => onChange({ ...current, entryId: val })}
              schemaSlug={current.schemaSlug}
              disabled={disabled}
            />
          )}
        </div>
      )}
    </div>
  );
}


