'use client';
import { useEffect, useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { FieldDefinition, FieldType, FieldValue, ContentEntry } from '@research-cms/shared-types';
import { getAllEntries } from '../../lib/utils';

interface DynamicFieldInputProps {
  field: FieldDefinition;
  value: FieldValue;
  onChange: (name: string, value: FieldValue) => void;
  disabled?: boolean;
}

type SelectOption = { value: string; label: string };

const reactSelectStyles = (disabled: boolean) => ({
  control: (base: object) => ({
    ...base,
    fontSize: '14px',
    fontFamily: 'ui-monospace, monospace',
    borderRadius: 0,
    borderColor: '#d4d4d8',
    boxShadow: 'none',
    backgroundColor: disabled ? '#fafafa' : '#fff',
    '&:hover': { borderColor: '#52525b' },
  }),
  multiValue: (base: object) => ({ ...base, backgroundColor: '#f4f4f5', borderRadius: 0 }),
  multiValueLabel: (base: object) => ({ ...base, fontSize: '12px', fontFamily: 'ui-monospace, monospace' }),
});

export default function DynamicFieldInput({
  field,
  value,
  onChange,
  disabled = false,
}: DynamicFieldInputProps) {
  const [referenceOptions, setReferenceOptions] = useState<SelectOption[]>([]);
  const [referenceLoading, setReferenceLoading] = useState(false);

  useEffect(() => {
    const targetSlug =
      field.config?.type === 'reference' || field.config?.type === 'references'
        ? field.config.targetSlug
        : null;
    if (!targetSlug) return;

    setReferenceLoading(true);
    getAllEntries(targetSlug).then(({ data }) => {
      if (data) {
        setReferenceOptions(
          data.map(entry => ({ value: entry._id ?? '', label: getEntryLabel(entry) }))
        );
      }
      setReferenceLoading(false);
    });
  }, [field.config]);

  const rs = reactSelectStyles(disabled);

  switch (field.type as FieldType) {
    case FieldType.TEXTAREA:
      return (
        <textarea
          value={String(value ?? '')}
          onChange={e => onChange(field.name, e.target.value)}
          disabled={disabled}
          rows={4}
          className="field-input resize-y"
        />
      );

    case FieldType.NUMBER:
      return (
        <input
          type="number"
          value={String(value ?? '')}
          onChange={e => onChange(field.name, e.target.value === '' ? '' : Number(e.target.value))}
          disabled={disabled}
          className="field-input"
        />
      );

    case FieldType.BOOLEAN:
      return (
        <label className={`flex items-center gap-2 text-sm text-zinc-700 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={e => onChange(field.name, e.target.checked)}
            disabled={disabled}
          />
          {field.label}
        </label>
      );

    case FieldType.DATE:
      return (
        <input
          type="date"
          value={String(value ?? '')}
          onChange={e => onChange(field.name, e.target.value)}
          disabled={disabled}
          className="field-input"
        />
      );

    case FieldType.DATETIME:
      return (
        <input
          type="datetime-local"
          value={String(value ?? '')}
          onChange={e => onChange(field.name, e.target.value)}
          disabled={disabled}
          className="field-input"
        />
      );

    case FieldType.EMAIL:
      return (
        <input
          type="email"
          value={String(value ?? '')}
          onChange={e => onChange(field.name, e.target.value)}
          disabled={disabled}
          className="field-input"
        />
      );

    case FieldType.URL:
    case FieldType.IMAGE: {
      const isImage = field.type === FieldType.IMAGE;
      return (
        <div className="flex flex-col gap-2">
          <input
            type="url"
            value={String(value ?? '')}
            onChange={e => onChange(field.name, e.target.value)}
            disabled={disabled}
            placeholder="https://"
            className="field-input"
          />
          {isImage && Boolean(value) && (
            <img
              src={String(value)}
              alt="preview"
              className="max-h-28 max-w-full object-contain border border-zinc-100"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>
      );
    }

    case FieldType.SELECT: {
      const options = field.config?.type === 'select'
        ? field.config.options.map(o => ({ value: o, label: o }))
        : [];
      return (
        <Select<SelectOption>
          instanceId={`content-select-${field.name}`}
          options={options}
          value={options.find(o => o.value === value) ?? null}
          onChange={opt => onChange(field.name, opt?.value ?? '')}
          isDisabled={disabled}
          isClearable
          placeholder="Choose…"
          styles={rs}
        />
      );
    }

    case FieldType.TAGS: {
      const tagValues: SelectOption[] = Array.isArray(value)
        ? (value as string[]).map(v => ({ value: v, label: v }))
        : [];
      return (
        <CreatableSelect<SelectOption, true>
          instanceId={`content-tags-${field.name}`}
          isMulti
          value={tagValues}
          onChange={newVals => onChange(field.name, newVals.map(v => v.value))}
          isDisabled={disabled}
          placeholder="Type and press Enter…"
          noOptionsMessage={() => 'Type to add a tag'}
          components={{ DropdownIndicator: null }}
          styles={rs}
        />
      );
    }

    case FieldType.REFERENCE: {
      const refValue = referenceOptions.find(o => o.value === value) ?? null;
      return (
        <Select<SelectOption>
          instanceId={`content-ref-${field.name}`}
          options={referenceOptions}
          value={refValue}
          onChange={opt => onChange(field.name, opt?.value ?? '')}
          isDisabled={disabled || referenceLoading}
          isLoading={referenceLoading}
          isClearable
          isSearchable
          placeholder={referenceLoading ? 'Loading…' : 'Search entries…'}
          styles={rs}
        />
      );
    }

    case FieldType.REFERENCES: {
      const refValues = Array.isArray(value)
        ? referenceOptions.filter(o => (value as string[]).includes(o.value))
        : [];
      return (
        <Select<SelectOption, true>
          instanceId={`content-refs-${field.name}`}
          isMulti
          options={referenceOptions}
          value={refValues}
          onChange={newVals => onChange(field.name, newVals.map(v => v.value))}
          isDisabled={disabled || referenceLoading}
          isLoading={referenceLoading}
          isSearchable
          placeholder={referenceLoading ? 'Loading…' : 'Search entries…'}
          styles={rs}
        />
      );
    }

    default:
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={e => onChange(field.name, e.target.value)}
          disabled={disabled}
          className="field-input"
        />
      );
  }
}

function getEntryLabel(entry: ContentEntry): string {
  for (const val of Object.values(entry.data)) {
    if (typeof val === 'string' && val.trim()) return val;
  }
  return entry._id ?? '(no label)';
}
