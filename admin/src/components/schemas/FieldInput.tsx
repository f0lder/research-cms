'use client';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { FieldType, FieldDefinition, FieldConfig, ContentTypeDefinition } from '@research-cms/shared-types';

type SelectOption = { value: string; label: string };

const FIELD_TYPE_OPTIONS = [
  { label: 'Text', options: [
    { value: FieldType.TEXT,     label: 'Text' },
    { value: FieldType.TEXTAREA, label: 'Textarea' },
    { value: FieldType.EMAIL,    label: 'Email' },
    { value: FieldType.URL,      label: 'URL' },
  ]},
  { label: 'Numeric', options: [
    { value: FieldType.NUMBER,   label: 'Number' },
  ]},
  { label: 'Date / Time', options: [
    { value: FieldType.DATE,     label: 'Date' },
    { value: FieldType.DATETIME, label: 'Date & Time' },
  ]},
  { label: 'Toggle', options: [
    { value: FieldType.BOOLEAN,  label: 'Boolean' },
  ]},
  { label: 'Media', options: [
    { value: FieldType.IMAGE,    label: 'Image URL' },
  ]},
  { label: 'Choice', options: [
    { value: FieldType.SELECT,     label: 'Select' },
    { value: FieldType.TAGS,       label: 'Tags' },
  ]},
  { label: 'Relations', options: [
    { value: FieldType.REFERENCE,  label: 'Reference (one)' },
    { value: FieldType.REFERENCES, label: 'References (many)' },
  ]},
];

const reactSelectBase = (disabled: boolean) => ({
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
  groupHeading: (base: object) => ({
    ...base,
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    color: '#a1a1aa',
    letterSpacing: '0.05em',
  }),
  multiValue: (base: object) => ({ ...base, backgroundColor: '#f4f4f5', borderRadius: 0 }),
  multiValueLabel: (base: object) => ({ ...base, fontSize: '12px', fontFamily: 'ui-monospace, monospace' }),
});

interface FieldInputProps {
  field: FieldDefinition;
  index: number;
  disabled?: boolean;
  availableSchemas?: ContentTypeDefinition[];
  currentSlug?: string;
  onUpdate: (index: number, key: keyof FieldDefinition, value: string | boolean | FieldConfig | undefined) => void;
  onRemove: (index: number) => void;
}

export default function FieldInput({
  field,
  index,
  disabled = false,
  availableSchemas = [],
  currentSlug,
  onUpdate,
  onRemove,
}: FieldInputProps) {

  const handleTypeChange = (newType: FieldType) => {
    onUpdate(index, 'type', newType);
    if (newType === FieldType.SELECT)         onUpdate(index, 'config', { type: 'select', options: [] });
    else if (newType === FieldType.TAGS)      onUpdate(index, 'config', { type: 'tags' });
    else if (newType === FieldType.REFERENCE) onUpdate(index, 'config', { type: 'reference', targetSlug: '' });
    else if (newType === FieldType.REFERENCES) onUpdate(index, 'config', { type: 'references', targetSlug: '' });
    else                                      onUpdate(index, 'config', undefined);
  };

  const schemaOptions: SelectOption[] = [
    ...(currentSlug ? [{ value: currentSlug, label: `Self (${currentSlug})` }] : []),
    ...availableSchemas
      .filter(s => s.slug !== currentSlug)
      .map(s => ({ value: s.slug, label: `${s.name} (${s.slug})` })),
  ];

  const referenceConfig =
    field.config?.type === 'reference' || field.config?.type === 'references'
      ? (field.config as { type: 'reference' | 'references'; targetSlug: string })
      : null;

  const referenceTargetValue = referenceConfig?.targetSlug
    ? schemaOptions.find(o => o.value === referenceConfig.targetSlug) ?? null
    : null;

  const handleReferenceTargetChange = (opt: SelectOption | null) => {
    if (!opt) return;
    const configType = field.type === FieldType.REFERENCE ? 'reference' : 'references';
    onUpdate(index, 'config', { type: configType, targetSlug: opt.value });
  };

  const currentTypeOption =
    FIELD_TYPE_OPTIONS.flatMap(g => g.options).find(o => o.value === field.type) ?? null;

  const selectOptionValues: SelectOption[] =
    field.config?.type === 'select'
      ? field.config.options.map(o => ({ value: o, label: o }))
      : [];

  const handleSelectOptionsChange = (newValues: readonly SelectOption[]) => {
    onUpdate(index, 'config', { type: 'select', options: newValues.map(o => o.value) });
  };

  const rsStyles = reactSelectBase(disabled);

  return (
    <div className={`border border-zinc-200 p-4 mb-3 flex flex-col gap-3 ${disabled ? 'bg-zinc-50' : 'bg-white'}`}>

      {/* Name + Label */}
      <div className="flex gap-3">
        <div className="flex-1 field-wrap">
          <label className="field-label">Field Name *</label>
          <input
            placeholder="e.g., title"
            required
            value={field.name}
            onChange={e => onUpdate(index, 'name', e.target.value)}
            disabled={disabled}
            className="field-input"
          />
        </div>
        <div className="flex-1 field-wrap">
          <label className="field-label">Display Label *</label>
          <input
            placeholder="e.g., Product Title"
            required
            value={field.label}
            onChange={e => onUpdate(index, 'label', e.target.value)}
            disabled={disabled}
            className="field-input"
          />
        </div>
      </div>

      {/* Type + Required + Remove */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 field-wrap">
          <label className="field-label">Field Type *</label>
          <Select<SelectOption>
            instanceId={`field-type-${index}`}
            options={FIELD_TYPE_OPTIONS}
            value={currentTypeOption}
            onChange={opt => opt && handleTypeChange(opt.value as FieldType)}
            isDisabled={disabled}
            isSearchable
            placeholder="Select a type…"
            styles={rsStyles}
          />
        </div>
        <div className="flex items-center gap-3 pb-0.5">
          <label className={`flex items-center gap-1.5 text-sm text-zinc-600 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={field.required}
              onChange={e => onUpdate(index, 'required', e.target.checked)}
              disabled={disabled}
              className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            />
            Required
          </label>
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={disabled}
            className="btn-danger text-xs px-3 py-1.5"
            title="Remove field"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Reference target */}
      {(field.type === FieldType.REFERENCE || field.type === FieldType.REFERENCES) && (
        <div className="field-wrap">
          <label className="field-label">
            Target schema *
            {field.type === FieldType.REFERENCES && <span className="text-zinc-400"> (many)</span>}
          </label>
          <Select<SelectOption>
            instanceId={`field-ref-${index}`}
            options={schemaOptions}
            value={referenceTargetValue}
            onChange={handleReferenceTargetChange}
            isDisabled={disabled}
            isSearchable
            placeholder={schemaOptions.length === 0 ? 'No schemas available yet…' : 'Choose a schema…'}
            styles={rsStyles}
          />
          {referenceTargetValue === null && field.config &&
            (field.config.type === 'reference' || field.config.type === 'references') && (
            <span className="field-hint text-red-500">A target schema is required</span>
          )}
        </div>
      )}

      {/* Select options */}
      {field.type === FieldType.SELECT && (
        <div className="field-wrap">
          <label className="field-label">Options *</label>
          <CreatableSelect<SelectOption, true>
            instanceId={`field-options-${index}`}
            isMulti
            value={selectOptionValues}
            onChange={handleSelectOptionsChange}
            isDisabled={disabled}
            placeholder="Type an option and press Enter…"
            noOptionsMessage={() => 'Type to add an option'}
            components={{ DropdownIndicator: null }}
            styles={rsStyles}
          />
        </div>
      )}

      {/* DB key hint */}
      <div className="text-xs text-zinc-400 border-t border-zinc-100 pt-2">
        Database key:{' '}
        <code className="bg-zinc-100 px-1.5 py-0.5 text-zinc-600">{field.name || '(empty)'}</code>
      </div>
    </div>
  );
}
