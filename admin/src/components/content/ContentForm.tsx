'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContentTypeDefinition, ContentEntry, FieldValue } from '@research-cms/shared-types';
import { createEntry, updateEntry } from '@/app/actions';
import DynamicFieldInput from './DynamicFieldInput';
import { Button } from '@/components/ui';
import { Heading, Text } from '@/components/ui';

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
  const [publishAt, setPublishAt] = useState<string>(initialData?.publishAt ? new Date(initialData.publishAt).toISOString().slice(0, 16) : '');
  const [unpublishAt, setUnpublishAt] = useState<string>(initialData?.unpublishAt ? new Date(initialData.unpublishAt).toISOString().slice(0, 16) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (name: string, value: FieldValue) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const entryData = {
      ...formData,
      status: 'draft',
      ...(unpublishAt && { unpublishAt }),
    };

    const result =
      mode === 'create'
        ? await createEntry(schema.slug, entryData)
        : await updateEntry(schema.slug, initialData?._id ?? '', entryData);

    setSaving(false);
    if (result.error) { setError(result.error); return; }
    onSuccess?.();
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Determine status: if publishAt is in future, schedule it; otherwise publish immediately
    const pubAt = publishAt ? new Date(publishAt) : null;
    const shouldSchedule = pubAt && pubAt > new Date();
    const finalStatus = shouldSchedule ? 'scheduled' : 'published';

    // If publishing immediately without a publishAt date, set it to now
    const finalPublishAt = publishAt || new Date().toISOString().slice(0, 16);

    const entryData = {
      ...formData,
      status: finalStatus,
      publishAt: finalPublishAt,
      ...(unpublishAt && { unpublishAt }),
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
    <form className="max-w-2xl font-mono">
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

        {/* Publish at (optional) */}
        <div className="field-wrap">
          <label className="field-label">Publish at (optional)</label>
          <input
            type="datetime-local"
            value={publishAt}
            onChange={e => setPublishAt(e.target.value)}
            disabled={saving}
            className="field-input"
            min={new Date().toISOString().slice(0, 16)}
          />
          <p className="text-xs text-zinc-400 mt-1">
            Leave empty to publish immediately. Set a future date to schedule.
          </p>
        </div>

        {/* Unpublish at (optional) */}
        <div className="field-wrap">
          <label className="field-label">Unpublish at (optional)</label>
          <input
            type="datetime-local"
            value={unpublishAt}
            onChange={e => setUnpublishAt(e.target.value)}
            disabled={saving}
            className="field-input"
          />
          <p className="text-xs text-zinc-400 mt-1">
            Auto-archive this entry after this date.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="flex gap-3 pt-4 border-t border-zinc-100">
        <Button type="button" onClick={handleSaveDraft} disabled={saving} className="btn-secondary">
          {saving ? 'Saving…' : 'Save Draft'}
        </Button>
        <Button type="button" onClick={handlePublish} disabled={saving} className="btn-primary">
          {saving ? 'Publishing…' : 'Publish'}
        </Button>
        <Button
          type="button"
          onClick={() => router.back()}
          disabled={saving}
          className="btn-ghost"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
