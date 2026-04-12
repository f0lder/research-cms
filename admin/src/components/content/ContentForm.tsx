'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContentTypeDefinition, ContentEntry, FieldValue } from '@research-cms/shared-types';
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
  const [status, setStatus] = useState<string>(initialData?.status ?? 'draft');
  const [publishAt, setPublishAt] = useState<string>(initialData?.publishAt ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (name: string, value: FieldValue) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const entryData = {
      ...formData,
      status,
      ...(publishAt && { publishAt }),
    };

    const result =
      mode === 'create'
        ? await createEntry(schema.slug, entryData)
        : await updateEntry(schema.slug, initialData?._id ?? '', entryData);

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

      {/* Publishing section */}
      <div className="mt-8 pt-6 border-t border-zinc-200">
        <h3 className="text-sm font-semibold text-zinc-700 mb-4">Publishing</h3>

        {/* Status */}
        <div className="field-wrap">
          <label className="field-label">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            disabled={saving}
            className="field-input"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Publish at (if scheduled) */}
        {status === 'scheduled' && (
          <div className="field-wrap">
            <label className="field-label">Publish at</label>
            <input
              type="datetime-local"
              value={publishAt}
              onChange={e => setPublishAt(e.target.value)}
              disabled={saving}
              className="field-input"
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>
        )}
      </div>

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
