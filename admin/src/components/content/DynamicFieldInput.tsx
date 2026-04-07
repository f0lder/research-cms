'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { FieldDefinition, FieldType, FieldValue, MediaEntry } from '@research-cms/shared-types';
// MediaEntry used below for MEDIA field state typing
import { getAllEntries, getEntryTitle } from '@/lib/utils';

const MediaPickerModal = dynamic(() => import('./MediaPickerModal'), { ssr: false });

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
          data.items.map(entry => ({ value: entry._id ?? '', label: getEntryTitle(entry) }))
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
      return (
        <input
          type="url"
          value={String(value ?? '')}
          onChange={e => onChange(field.name, e.target.value)}
          disabled={disabled}
          placeholder="https://"
          className="field-input"
        />
      );

    case FieldType.MEDIA: {
      const [pickerOpen, setPickerOpen] = useState(false);
      const [resolved, setResolved] = useState<MediaEntry | null>(null);

      // Resolve current ID to a media entry for preview
      useEffect(() => {
        if (!value) { setResolved(null); return; }
        // value is the entry _id; fetch library and find it
        import('@/lib/utils').then(({ getMediaLibrary }) =>
          getMediaLibrary().then(res => {
            setResolved(res.data?.find(m => m._id === value) ?? null);
          })
        );
      }, [value]);

      return (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            {resolved ? (
              <div className="flex items-center gap-2 flex-1 border border-zinc-200 px-2 py-1.5 bg-zinc-50">
                <img src={resolved.url} alt={resolved.altText || resolved.title} className="w-8 h-8 object-cover border border-zinc-200" />
                <span className="text-sm text-zinc-700 flex-1 truncate">{resolved.title}</span>
                <button type="button" onClick={() => { onChange(field.name, ''); setResolved(null); }}
                  className="text-zinc-400 hover:text-red-500 text-xs px-1">✕</button>
              </div>
            ) : (
              <span className="text-sm text-zinc-400 flex-1">No media selected</span>
            )}
            <button type="button" onClick={() => setPickerOpen(true)} disabled={disabled}
              className="btn-secondary text-xs px-3 py-1.5 whitespace-nowrap">
              {resolved ? 'Change' : 'Choose media'}
            </button>
          </div>

          {pickerOpen && (
            <MediaPickerModal
              currentId={String(value ?? '')}
              onSelect={entry => { onChange(field.name, entry._id); setResolved(entry); setPickerOpen(false); }}
              onClose={() => setPickerOpen(false)}
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

