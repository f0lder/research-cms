'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FieldType, FieldDefinition, FieldConfig, ContentTypeDefinition } from '@research-cms/shared-types';
import {
  getAllSchemas,
  createSchema,
  updateSchema,
  deleteSchema,
  generateSlugFromName,
  validateSlug,
  getErrorMessage,
  generateRandomId,
} from '@/lib/utils';
import FieldInput from './FieldInput';

const DEFAULT_FIELDS: FieldDefinition[] = [
  { name: 'title',   label: 'Title',   type: FieldType.TEXT,     required: true  },
  { name: 'status',  label: 'Status',  type: FieldType.SELECT,   required: true,
    config: { type: 'select', options: ['draft', 'published', 'private'] } },
  { name: 'excerpt', label: 'Excerpt', type: FieldType.TEXTAREA, required: false },
];

interface SchemaFormProps {
  mode: 'create' | 'edit';
  initialData?: ContentTypeDefinition;
  onSuccess?: () => void;
}

export default function SchemaForm({ mode, initialData, onSuccess }: SchemaFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [fields, setFields] = useState<FieldDefinition[]>(
    initialData?.fields ?? (mode === 'create' ? DEFAULT_FIELDS : [])
  );
  const [fieldIds, setFieldIds] = useState<string[]>(() =>
    (initialData?.fields ?? (mode === 'create' ? DEFAULT_FIELDS : [])).map(() => generateRandomId())
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualSlugEdit, setManualSlugEdit] = useState(false);
  const [availableSchemas, setAvailableSchemas] = useState<ContentTypeDefinition[]>([]);

  useEffect(() => {
    getAllSchemas().then(({ data }) => { if (data) setAvailableSchemas(data); });
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!manualSlugEdit && mode === 'create') setSlug(generateSlugFromName(value));
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setManualSlugEdit(true);
  };

  const addField = () => {
    setFields(prev => [...prev, { name: '', label: '', type: FieldType.TEXT, required: false }]);
    setFieldIds(prev => [...prev, generateRandomId()]);
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
    setFieldIds(prev => prev.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof FieldDefinition, value: string | boolean | FieldConfig | undefined) => {
    setFields(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');

    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) { setError(slugValidation.error ?? 'Invalid slug'); return; }
    if (fields.length === 0) { setError('At least one field is required'); return; }

    const fieldNames = fields.map(f => f.name);
    const duplicates = fieldNames.filter((n, i) => fieldNames.indexOf(n) !== i);
    if (duplicates.length > 0) { setError(`Duplicate field names: ${duplicates.join(', ')}`); return; }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const { error: err } = await createSchema({ name, slug, fields });
        if (err) { setError(err); setIsSubmitting(false); return; }
      } else {
        const { error: err } = await updateSchema(initialData?.slug || slug, { name, slug, fields });
        if (err) { setError(err); setIsSubmitting(false); return; }
      }
      if (onSuccess) onSuccess(); else router.push('/schemas');
    } catch (err) {
      setError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this schema? This cannot be undone.')) return;
    setIsSubmitting(true);
    const { error: err } = await deleteSchema(initialData?.slug ?? '');
    if (err) { setError(err); setIsSubmitting(false); return; }
    router.push('/schemas');
  };

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-8">
        <h1 className="page-heading">
          {mode === 'create' ? 'Create Content Type' : 'Edit Content Type'}
        </h1>
        {mode === 'edit' && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="btn-danger"
          >
            Delete Schema
          </button>
        )}
      </div>

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="field-wrap">
          <label className="field-label">Schema Name *</label>
          <input
            required
            value={name}
            onChange={e => handleNameChange(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., Product"
            className="field-input"
          />
        </div>

        <div className="field-wrap">
          <label className="field-label">URL Slug *</label>
          <input
            required
            value={slug}
            onChange={e => handleSlugChange(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., product"
            className="field-input"
          />
          <span className="field-hint">Lowercase letters, numbers, and dashes only</span>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">Fields</h3>
          {fields.length === 0 && (
            <p className="text-sm text-zinc-400 mb-3">No fields defined. Click "Add Field" to start.</p>
          )}
          {fields.map((field, i) => (
            <FieldInput
              key={fieldIds[i]}
              index={i}
              field={field}
              onUpdate={updateField}
              onRemove={removeField}
              disabled={isSubmitting}
              availableSchemas={availableSchemas}
              currentSlug={slug}
              existingKeys={fields.filter((_, j) => j !== i).map(f => f.name).filter(Boolean)}
            />
          ))}
          <button
            type="button"
            onClick={addField}
            disabled={isSubmitting}
            className="btn-secondary mt-2"
          >
            + Add Field
          </button>
        </div>

        <div className="flex gap-3 pt-2 border-t border-zinc-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1 py-3"
          >
            {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Schema' : 'Update Schema'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/schemas')}
            disabled={isSubmitting}
            className="btn-secondary px-8 py-3"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
