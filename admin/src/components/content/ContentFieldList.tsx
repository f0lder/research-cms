'use client';
import { ContentTypeDefinition, FieldValue } from '@research-cms/shared-types';
import DynamicFieldInput from './DynamicFieldInput';

interface ContentFieldListProps {
  schema: ContentTypeDefinition;
  formData: Record<string, FieldValue>;
  disabled: boolean;
  onFieldChange: (name: string, value: FieldValue) => void;
}

export function ContentFieldList({
  schema,
  formData,
  disabled,
  onFieldChange,
}: ContentFieldListProps) {
  return (
    <>
      {schema.fields.length === 0 && (
        <p className="text-sm text-zinc-400 italic mb-4">This schema has no fields defined yet.</p>
      )}

      {schema.fields.map(field => (
        <div key={field.name} className="field-wrap">
          {field.type !== 'boolean' && (
            <label className="field-label">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}
          <DynamicFieldInput
            field={field}
            value={formData[field.name]}
            onChange={onFieldChange}
            disabled={disabled}
          />
        </div>
      ))}
    </>
  );
}
