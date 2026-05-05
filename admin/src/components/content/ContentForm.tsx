'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContentTypeDefinition, ContentEntry, FieldValue } from '@research-cms/shared-types';
import { createEntry, updateEntry } from '@/app/actions';
import { useToast } from '@/contexts/ToastContext';
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
  const [status, setStatus] = useState<'draft' | 'published'>(initialData?.status || 'draft');
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
    };

    const result =
      mode === 'create'
        ? await createEntry(schema.slug, entryData)
        : await updateEntry(schema.slug, initialData?._id ?? '', entryData);

    setSaving(false);
    if (result.error) { 
      setError(result.error); 
      showToast(`Failed to save draft: ${result.error}`, 'error');
      return; 
    }
    showToast(`Draft ${mode === 'create' ? 'created' : 'updated'} successfully`, 'success');
    onSuccess?.(result.data);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const entryData = {
      ...formData,
      status: 'published',
      publishedAt: initialData?.publishedAt || new Date().toISOString(),
    };

    const result =
      mode === 'create'
        ? await createEntry(schema.slug, entryData)
        : await updateEntry(schema.slug, initialData?._id ?? '', entryData);

    setSaving(false);
    if (result.error) { 
      setError(result.error); 
      showToast(`Failed to publish: ${result.error}`, 'error');
      return; 
    }
    showToast(`Entry ${mode === 'create' ? 'published' : 'updated'} successfully`, 'success');
    onSuccess?.(result.data);
  };

  return (
    <form className="max-w-2xl font-mono">
      <ContentFieldList
        schema={schema}
        formData={formData}
        disabled={saving}
        onFieldChange={handleFieldChange}
      />

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
