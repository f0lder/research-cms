'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FieldDefinition, FieldConfig, ContentTypeDefinition } from '@research-cms/shared-types';
import { getAllSchemas, createSchema, updateSchema, deleteSchema } from '@/app/actions';
import { generateSlugFromName, validateSlug, generateRandomId, getErrorMessage } from '@/lib/utils';
import { Button, Container, TextField, Heading, Text } from '@/components/ui';
import FieldInput from './FieldInput';

const DEFAULT_FIELDS: FieldDefinition[] = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'status', label: 'Status', type: 'select', required: true, config: { type: 'select', options: ['draft', 'published', 'private'] } },
  { name: 'excerpt', label: 'Excerpt', type: 'textarea', required: false },
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
    (async () => {
      const { data } = await getAllSchemas();
      if (data) setAvailableSchemas(data);
    })();
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
    setFields(prev => [...prev, { name: '', label: '', type: 'text', required: false }]);
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
    <Container size="lg" padding="lg">
      <div className="flex items-center justify-between mb-8">
        <Heading level={1}>
          {mode === 'create' ? 'Create Content Type' : 'Edit Content Type'}
        </Heading>
        {mode === 'edit' && (
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            variant="destructive"
            size="sm"
          >
            Delete Schema
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-6 border-2 border-error bg-surface px-4 py-3">
          <Text variant="body-sm" color="error">{error}</Text>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <TextField
          label="Schema Name *"
          required
          value={name}
          onChange={e => handleNameChange(e.target.value)}
          disabled={isSubmitting}
          placeholder="e.g., Product"
        />

        <TextField
          label="URL Slug *"
          required
          value={slug}
          onChange={e => handleSlugChange(e.target.value)}
          disabled={isSubmitting}
          placeholder="e.g., product"
          helperText="Lowercase letters, numbers, and dashes only"
        />

        <div>
          <Heading level={3} className="mb-3">Fields</Heading>
          {fields.length === 0 && (
            <Text variant="body-sm" color="secondary" className="mb-3">
              No fields defined. Click &quot;Add Field&quot; to start.
            </Text>
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
          <Button
            type="button"
            onClick={addField}
            disabled={isSubmitting}
            variant="secondary"
            size="sm"
            className="mt-2"
          >
            + Add Field
          </Button>
        </div>

        <div className="flex gap-3 pt-4 border-t-2 border-on-surface">
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="primary"
            size="lg"
            className="flex-1"
          >
            {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Schema' : 'Update Schema'}
          </Button>
          <Button
            type="button"
            onClick={() => router.push('/schemas')}
            disabled={isSubmitting}
            variant="secondary"
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Container>
  );
}
