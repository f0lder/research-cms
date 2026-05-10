'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContentTypeDefinition, ContentEntry, FieldValue } from '@research-cms/shared-types';
import { createEntry, updateEntry } from '@/app/actions';
import { useToast } from '@/contexts/ToastContext';
import { TextField, Heading } from '@/components/ui';
import { ContentFieldList } from './ContentFieldList';
import { ContentStatusDisplay } from './ContentStatusDisplay';
import { ContentActions } from './ContentActions';

interface ContentFormProps {
  mode: 'create' | 'edit';
  schema: ContentTypeDefinition;
  initialData?: ContentEntry;
  onSuccess?: (updatedEntry?: ContentEntry) => void;
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
  const { showToast } = useToast();
  const [formData, setFormData] = useState<Record<string, FieldValue>>(
    () => buildDefaults(schema, initialData)
  );
  const [status, setStatus] = useState<'draft' | 'published'>(
    initialData?.status === 'published' ? 'published' : 'draft'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (name: string, value: FieldValue) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const save = async (nextStatus: 'draft' | 'published') => {
    setSaving(true);
    setError(null);

    const entryData: Record<string, FieldValue> = {
      ...formData,
      status: nextStatus,
      ...(nextStatus === 'published' && {
        publishedAt: initialData?.publishedAt || new Date().toISOString(),
      }),
    };

    const result =
      mode === 'create'
        ? await createEntry(schema.slug, entryData)
        : await updateEntry(schema.slug, initialData?._id ?? '', entryData);

    setSaving(false);
    if (result.error) {
      setError(result.error);
      showToast(
        `${nextStatus === 'draft' ? 'Failed to save draft' : 'Failed to publish'}: ${result.error}`,
        'error'
      );
      return;
    }
    setStatus(nextStatus);
    const verb = nextStatus === 'draft'
      ? (mode === 'create' ? 'created' : 'updated')
      : (mode === 'create' ? 'published' : 'updated');
    showToast(`${nextStatus === 'draft' ? 'Draft' : 'Entry'} ${verb} successfully`, 'success');
    onSuccess?.(result.data);
  };

  const handleSaveDraft = () => save('draft');
  const handlePublish = () => save('published');

  return (
    <form className="max-w-2xl font-mono">
      <ContentFieldList
        schema={schema}
        formData={formData}
        disabled={saving}
        onFieldChange={handleFieldChange}
      />

      {schema.features?.seo && (
        <div className="mt-6 border-2 border-on-surface p-4 bg-surface-container-low">
          <Heading level={3} className="mb-4">SEO</Heading>
          <div className="space-y-4">
            <TextField
              label="Meta Title"
              value={String(formData.metaTitle ?? '')}
              onChange={e => handleFieldChange('metaTitle', e.target.value)}
              disabled={saving}
              placeholder="Title for search engines (50-60 chars)"
              helperText="Appears in browser tabs and search results"
            />
            <TextField
              label="Meta Description"
              value={String(formData.metaDescription ?? '')}
              onChange={e => handleFieldChange('metaDescription', e.target.value)}
              disabled={saving}
              placeholder="Brief summary (150-160 chars)"
              helperText="Displayed under title in search results"
            />
          </div>
        </div>
      )}

      <ContentStatusDisplay status={status} publishedAt={initialData?.publishedAt} schema={schema} />

      <ContentActions
        schema={schema}
        saving={saving}
        error={error}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onCancel={() => router.back()}
      />
    </form>
  );
}
