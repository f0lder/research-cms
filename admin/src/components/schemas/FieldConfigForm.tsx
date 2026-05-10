'use client';
import { FieldType, FieldDefinition } from '@research-cms/shared-types';
import { Text, Toggle } from '@/components/ui';

interface FieldConfigFormProps {
  type: FieldType;
  field: Partial<FieldDefinition>;
  onChange: (updates: Partial<FieldDefinition>) => void;
  mode: 'create' | 'edit';
}

export function FieldConfigForm({ type, field, onChange, mode }: FieldConfigFormProps) {
  const handleLabelChange = (value: string) => {
    onChange({ label: value });
  };

  const handleSlugChange = (value: string) => {
    onChange({ name: value });
  };

  const handleRequiredChange = (value: boolean) => {
    onChange({ required: value });
  };

  const handleSelectOptionsChange = (options: string[]) => {
    onChange({ config: { type: 'select', options } });
  };

  const handleTargetSlugChange = (value: string) => {
    if (type !== 'reference' && type !== 'references') return;
    onChange({ config: { type, targetSlug: value } });
  };

  const selectOptions =
    field.config?.type === 'select' ? (field.config.options as string[]) : [];

  const targetSlug =
    field.config?.type === 'reference' || field.config?.type === 'references'
      ? String(field.config.targetSlug ?? '')
      : '';

  return (
    <div className="space-y-3">
      {/* Label and Slug in two columns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Label */}
        <div>
          <label className="block text-xs font-bold uppercase text-on-surface mb-1">Label *</label>
          <input
            type="text"
            value={field.label || ''}
            onChange={e => handleLabelChange(e.target.value)}
            placeholder="e.g., Product Title"
            className="w-full border-2 border-on-surface px-2 py-1 font-mono text-sm"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-bold uppercase text-on-surface mb-1">
            Slug {mode === 'edit' && '(R/O)'}
          </label>
          <input
            type="text"
            value={field.name || ''}
            onChange={e => handleSlugChange(e.target.value)}
            disabled={mode === 'edit'}
            placeholder="e.g., product_title"
            className="w-full border-2 border-on-surface px-2 py-1 font-mono text-sm disabled:bg-surface-container"
          />
        </div>
      </div>

      {/* Required toggle */}
      <Toggle
        checked={field.required || false}
        onChange={value => handleRequiredChange(value)}
        label="Required"
      />

      {/* Type-specific config */}
      {type === 'select' && (
        <SelectOptions
          options={selectOptions}
          onChange={handleSelectOptionsChange}
        />
      )}

      {(type === 'reference' || type === 'references') && (
        <ReferenceConfig
          targetSlug={targetSlug}
          onChange={handleTargetSlugChange}
        />
      )}

      {/* Type badge */}
      <div className="bg-surface-container-low border border-on-surface p-2 rounded text-xs">
        <strong>Type:</strong> <span className="font-mono text-primary">{type}</span>
        <div className="text-xs text-on-surface-variant mt-0.5">Cannot be changed after creation</div>
      </div>
    </div>
  );
}

function SelectOptions({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-bold uppercase text-on-surface mb-2">Options</label>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={opt}
              onChange={e => {
                const newOpts = [...options];
                newOpts[i] = e.target.value;
                onChange(newOpts);
              }}
              placeholder="Option value"
              className="flex-1 border-2 border-on-surface px-3 py-2 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(options.filter((_, idx) => idx !== i))}
              className="px-3 py-2 bg-error text-surface font-bold text-sm"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...options, ''])}
        className="mt-2 border-2 border-on-surface px-3 py-2 text-sm font-bold uppercase hover:bg-surface-container w-full"
      >
        + Add Option
      </button>
    </div>
  );
}

function ReferenceConfig({
  targetSlug,
  onChange,
}: {
  targetSlug: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-bold uppercase text-on-surface mb-1">
        Target Schema Slug *
      </label>
      <input
        type="text"
        value={targetSlug}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g., author"
        className="w-full border-2 border-on-surface px-3 py-2 font-mono text-sm"
      />
    </div>
  );
}
