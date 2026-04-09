'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContentTypeDefinition, ContentEntry, FieldType, FieldValue } from '@research-cms/shared-types';
import { createEntry, updateEntry } from '@/app/actions';
import DynamicFieldInput from './DynamicFieldInput';

interface ContentFormProps {
  mode: 'create' | 'edit';
  schema: ContentTypeDefinition;
  initialData?: ContentEntry;
  onSuccess?: () => void;
}

function buildDefaults(schema: ContentTypeDefinition, initial?: ContentEntry): Record<string, FieldValue> {
  const defaults: Record<string, FieldValue> = {};
  for (const field of schema.fields) {
    if (initial?.data && field.name in initial.data) {
      defaults[field.name] = initial.data[field.name];
    } else if (field.type === 'boolean') {
      defaults[field.name] = false;
    } else if (field.type === 'tags' || field.type === 'references') {
      defaults[field.name] = [];
    } else {
      defaults[field.name] = '';
    }
  }
  return defaults;
}

export default function ContentForm({ mode, schema, initialData, onSuccess }: ContentFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, FieldValue>>(
    () => buildDefaults(schema, initialData)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (name: string, value: FieldValue) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result =
      mode === 'create'
        ? await createEntry(schema.slug, formData)
        : await updateEntry(schema.slug, initialData?._id ?? '', formData);

    setSaving(false);
    if (result.error) { setError(result.error); return; }
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl font-mono">
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
            onChange={handleFieldChange}
            disabled={saving}
          />
        </div>
      ))}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="flex gap-3 pt-4 border-t border-zinc-100">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : mode === 'create' ? 'Create entry' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={saving}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
