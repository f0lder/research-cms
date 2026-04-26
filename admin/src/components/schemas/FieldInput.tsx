'use client';
import { useState } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { FieldType, FieldDefinition, FieldConfig, ContentTypeDefinition } from '@research-cms/shared-types';
import { labelToFieldKey } from '@/lib/utils';
import { Button, Text } from '@/components/ui';

type SelectOption = { value: string; label: string };

const FIELD_TYPE_OPTIONS = [
  { label: 'Text', options: [
    { value: 'text',      label: 'Text' },
    { value: 'textarea',  label: 'Textarea' },
    { value: 'email',     label: 'Email' },
    { value: 'url',       label: 'URL' },
  ]},
  { label: 'Numeric', options: [
    { value: 'number',    label: 'Number' },
  ]},
  { label: 'Date / Time', options: [
    { value: 'date',      label: 'Date' },
    { value: 'datetime',  label: 'Date & Time' },
  ]},
  { label: 'Toggle', options: [
    { value: 'boolean',   label: 'Boolean' },
  ]},
  { label: 'Media', options: [
    { value: 'media', label: 'Media' },
  ]},
  { label: 'Choice', options: [
    { value: 'select',    label: 'Select' },
    { value: 'tags',      label: 'Tags' },
  ]},
  { label: 'Relations', options: [
    { value: 'reference',  label: 'Reference (one)' },
    { value: 'references', label: 'References (many)' },
  ]},
];

const rsStyles = (disabled: boolean) => ({
  control: (base: object) => ({
    ...base,
    fontSize: '13px',
    fontFamily: 'ui-monospace, monospace',
    borderRadius: 0,
    borderWidth: '2px',
    borderColor: '#000',
    boxShadow: 'none',
    minHeight: '38px',
    backgroundColor: disabled ? '#f4f4f5' : '#fff',
    '&:hover': { borderColor: '#000' },
  }),
  groupHeading: (base: object) => ({
    ...base,
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    color: '#71717a',
    letterSpacing: '0.05em',
    fontWeight: 700,
  }),
  menu: (base: object) => ({
    ...base,
    borderRadius: 0,
    border: '2px solid #000',
    boxShadow: '4px 4px 0 #000',
  }),
  multiValue: (base: object) => ({ ...base, backgroundColor: '#f4f4f5', borderRadius: 0, border: '1px solid #000' }),
  multiValueLabel: (base: object) => ({ ...base, fontSize: '12px', fontFamily: 'ui-monospace, monospace' }),
  valueContainer: (base: object) => ({ ...base, padding: '0 8px' }),
  indicatorsContainer: (base: object) => ({ ...base, height: '38px' }),
});

const inputClass = (error = false, disabled = false) =>
  `w-full border-2 ${error ? 'border-error' : 'border-on-surface'} ${disabled ? 'bg-surface-container' : 'bg-surface'} px-3 py-2 font-code text-code text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`;

const keyInputClass = (error = false) =>
  `w-full font-code text-caption bg-transparent border-0 border-b-2 outline-none px-1 py-0.5 ${error ? 'text-error border-error' : 'text-on-surface-variant border-transparent focus:border-on-surface'}`;

interface FieldInputProps {
  field: FieldDefinition;
  index: number;
  disabled?: boolean;
  availableSchemas?: ContentTypeDefinition[];
  currentSlug?: string;
  existingKeys?: string[];
  onUpdate: (index: number, key: keyof FieldDefinition, value: string | boolean | FieldConfig | undefined) => void;
  onRemove: (index: number) => void;
}

function deduplicateKey(key: string, existingKeys: string[]): string {
  if (!existingKeys.includes(key)) return key;
  let i = 2;
  while (existingKeys.includes(`${key}_${i}`)) i++;
  return `${key}_${i}`;
}

export default function FieldInput({
  field, index, disabled = false, availableSchemas = [],
  currentSlug, existingKeys = [], onUpdate, onRemove,
}: FieldInputProps) {
  const [manualKeyEdit, setManualKeyEdit] = useState(() => !!field.name);

  const isDuplicate = field.name !== '' && existingKeys.includes(field.name);

  const handleLabelChange = (value: string) => {
    onUpdate(index, 'label', value);
    if (!manualKeyEdit) {
      onUpdate(index, 'name', deduplicateKey(labelToFieldKey(value), existingKeys));
    }
  };

  const handleNameChange = (value: string) => {
    setManualKeyEdit(true);
    onUpdate(index, 'name', value);
  };

  const handleTypeChange = (newType: FieldType) => {
    onUpdate(index, 'type', newType);
    if (newType === 'select')          onUpdate(index, 'config', { type: 'select', options: [] });
    else if (newType === 'tags')       onUpdate(index, 'config', { type: 'tags' });
    else if (newType === 'reference')  onUpdate(index, 'config', { type: 'reference', targetSlug: '' });
    else if (newType === 'references') onUpdate(index, 'config', { type: 'references', targetSlug: '' });
    else                                       onUpdate(index, 'config', undefined);
  };

  const schemaOptions: SelectOption[] = [
    ...(currentSlug ? [{ value: currentSlug, label: `Self (${currentSlug})` }] : []),
    ...availableSchemas.filter(s => s.slug !== currentSlug).map(s => ({ value: s.slug, label: s.name })),
  ];

  const referenceConfig =
    field.config?.type === 'reference' || field.config?.type === 'references'
      ? (field.config as { type: 'reference' | 'references'; targetSlug: string })
      : null;

  const currentTypeOption =
    FIELD_TYPE_OPTIONS.flatMap(g => g.options).find(o => o.value === field.type) ?? null;

  const selectOptionValues: SelectOption[] =
    field.config?.type === 'select'
      ? (field.config.options as string[]).map((o: string) => ({ value: o, label: o }))
      : [];

  const needsConfig = field.type === 'select'
    || field.type === 'reference'
    || field.type === 'references';

  return (
    <div className={`border-2 border-on-surface mb-3 ${disabled ? 'bg-surface-container' : 'bg-surface'}`}>

      {/* Main row */}
      <div className="flex items-start gap-3 p-3">

        {/* Label + key */}
        <div className="flex-1 min-w-0">
          <input
            placeholder="Field label…"
            required
            value={field.label}
            onChange={e => handleLabelChange(e.target.value)}
            disabled={disabled}
            className={inputClass(false, disabled)}
          />
          <div className="flex items-center gap-2 mt-1.5">
            <Text variant="caption" color="secondary" className="font-code shrink-0">key:</Text>
            <input
              placeholder="field_key"
              required
              value={field.name}
              onChange={e => handleNameChange(e.target.value)}
              disabled={disabled}
              className={keyInputClass(isDuplicate)}
            />
            {isDuplicate && (
              <Text variant="caption" color="error" className="shrink-0 font-bold uppercase">duplicate</Text>
            )}
          </div>
        </div>

        {/* Type */}
        <div className="w-44 shrink-0">
          <Select<SelectOption>
            instanceId={`field-type-${index}`}
            options={FIELD_TYPE_OPTIONS}
            value={currentTypeOption}
            onChange={opt => opt && handleTypeChange(opt.value as FieldType)}
            isDisabled={disabled}
            isSearchable
            placeholder="Type…"
            styles={rsStyles(disabled)}
          />
        </div>

        {/* Required */}
        <label className={`flex items-center gap-2 text-caption font-label uppercase text-on-surface-variant shrink-0 self-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={field.required}
            onChange={e => onUpdate(index, 'required', e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 accent-primary"
          />
          Req
        </label>

        {/* Remove */}
        <Button
          type="button"
          onClick={() => onRemove(index)}
          disabled={disabled}
          variant="ghost"
          size="xs"
          aria-label="Remove field"
          title="Remove field"
          className="self-center text-on-surface-variant hover:text-error"
        >
          ×
        </Button>
      </div>

      {/* Config row — only for types that need extra options */}
      {needsConfig && (
        <div className="border-t-2 border-on-surface px-3 py-3 bg-surface-container">
          {field.type === 'select' && (
            <div className="flex items-center gap-2">
              <Text variant="caption" color="secondary" className="font-code shrink-0">options:</Text>
              <CreatableSelect<SelectOption, true>
                instanceId={`field-options-${index}`}
                isMulti
                value={selectOptionValues}
                onChange={vals => onUpdate(index, 'config', { type: 'select', options: vals.map(o => o.value) })}
                isDisabled={disabled}
                placeholder="Type and press Enter…"
                noOptionsMessage={() => 'Type to add'}
                components={{ DropdownIndicator: null }}
                styles={rsStyles(disabled)}
                className="flex-1"
              />
            </div>
          )}
          {(field.type === 'reference' || field.type === 'references') && (
            <div className="flex items-center gap-2">
              <Text variant="caption" color="secondary" className="font-code shrink-0">target:</Text>
              <Select<SelectOption>
                instanceId={`field-ref-${index}`}
                options={schemaOptions}
                value={referenceConfig?.targetSlug
                  ? schemaOptions.find(o => o.value === referenceConfig.targetSlug) ?? null
                  : null}
                onChange={opt => {
                  if (!opt) return;
                  const t = field.type === 'reference' ? 'reference' : 'references';
                  onUpdate(index, 'config', { type: t, targetSlug: opt.value });
                }}
                isDisabled={disabled}
                isSearchable
                placeholder={schemaOptions.length === 0 ? 'No schemas yet…' : 'Choose schema…'}
                styles={rsStyles(disabled)}
                className="flex-1"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
