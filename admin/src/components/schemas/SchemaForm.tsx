'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FieldDefinition, ContentTypeDefinition } from '@research-cms/shared-types';
import { getAllSchemas, createSchema, updateSchema, deleteSchema } from '@/app/actions';
import { generateSlugFromName, validateSlug, getErrorMessage } from '@/lib/utils';
import { Button, Container, TextField, Heading, Text } from '@/components/ui';
import { FieldModal } from './FieldModal';
import { SchemaMetadata } from './SchemaMetadata';
import { SchemaFieldsList } from './SchemaFieldsList';
import { SchemaSaveActions } from './SchemaSaveActions';
import { useToast } from '@/contexts/ToastContext';
import { useSchemas } from '@/contexts/SchemaContext';

interface SchemaFormProps {
  mode: 'create' | 'edit';
  initialData?: ContentTypeDefinition;
  onSuccess?: () => void;
}

export default function SchemaForm({ mode, initialData, onSuccess }: SchemaFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { refetch, updateSchema: updateSchemaCache, addSchema: addSchemaCache } = useSchemas();

  const [name, setName] = useState(initialData?.name || '');
  const [singularName, setSingularName] = useState(initialData?.singularName || '');
  const [pluralName, setPluralName] = useState(initialData?.pluralName || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [fields, setFields] = useState<FieldDefinition[]>(
    initialData?.fields ?? []
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualSlugEdit, setManualSlugEdit] = useState(false);
  const [availableSchemas, setAvailableSchemas] = useState<ContentTypeDefinition[]>([]);
  const [features, setFeatures] = useState(initialData?.features || {
    drafts: true,
    revisions: false,
    search: true,
    seo: false,
  });

  // Field modal state
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

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

  const openFieldModal = (index?: number) => {
    if (index !== undefined) {
      setEditingFieldIndex(index);
    } else {
      setEditingFieldIndex(null);
    }
    setFieldModalOpen(true);
  };

  const closeFieldModal = () => {
    setFieldModalOpen(false);
    setEditingFieldIndex(null);
  };

  const handleFieldSave = (field: FieldDefinition) => {
    if (editingFieldIndex !== null) {
      setFields(prev => {
        const updated = [...prev];
        updated[editingFieldIndex] = field;
        return updated;
      });
      showToast('Field updated successfully', 'success');
    } else {
      setFields(prev => [...prev, field]);
      showToast('Field added successfully', 'success');
    }
    closeFieldModal();
  };

  const removeField = (index: number) => {
    const fieldLabel = fields[index].label;
    setFields(prev => prev.filter((_, i) => i !== index));
    showToast(`Deleted field: ${fieldLabel}`, 'info');
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');

    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) { 
      setError(slugValidation.error ?? 'Invalid slug'); 
      showToast(`Schema Error: ${slugValidation.error}`, 'error');
      return; 
    }
    if (fields.length === 0) { 
      setError('At least one field is required'); 
      showToast('Schema must have at least one field', 'error');
      return; 
    }

    const fieldNames = fields.map(f => f.name);
    const duplicates = fieldNames.filter((n, i) => fieldNames.indexOf(n) !== i);
    if (duplicates.length > 0) { 
      setError(`Duplicate field names: ${duplicates.join(', ')}`); 
      showToast(`Duplicate field names: ${duplicates.join(', ')}`, 'error');
      return; 
    }

    setIsSubmitting(true);
    
    // Construct the schema object for optimistic update
    const schemaData = {
      name,
      slug,
      singularName,
      pluralName,
      description,
      fields,
      features,
    };

    try {
      if (mode === 'create') {
        // Optimistic add to cache
        const optimisticSchema: ContentTypeDefinition = {
          _id: 'temp-' + Date.now(),
          ...schemaData,
        };
        addSchemaCache(optimisticSchema);
        
        const { error: err } = await createSchema(schemaData);
        if (err) { 
          setError(err); 
          showToast(`Failed to create schema: ${err}`, 'error');
          // Revert optimistic update
          await refetch();
          setIsSubmitting(false); 
          return; 
        }
        showToast(`Schema "${name}" created successfully`, 'success');
        // Refetch to get the real ID and ensure sync
        await refetch();
      } else {
        // Optimistic update in cache
        updateSchemaCache(initialData?.slug || slug, schemaData);
        
        const { error: err } = await updateSchema(initialData?.slug || slug, schemaData);
        if (err) { 
          setError(err); 
          showToast(`Failed to update schema: ${err}`, 'error');
          // Revert optimistic update
          await refetch();
          setIsSubmitting(false); 
          return; 
        }
        showToast(`Schema "${name}" updated successfully`, 'success');
        // Refetch to ensure sync
        await refetch();
      }
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setError(errMsg);
      showToast(`Error: ${errMsg}`, 'error');
      // Revert optimistic update on error
      await refetch();
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this schema? This cannot be undone.')) return;
    setIsSubmitting(true);
    const { error: err } = await deleteSchema(initialData?.slug ?? '');
    if (err) { 
      setError(err); 
      showToast(`Failed to delete schema: ${err}`, 'error');
      setIsSubmitting(false); 
      return; 
    }
    showToast('Schema deleted successfully', 'success');
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

        <SchemaMetadata
          singularName={singularName}
          pluralName={pluralName}
          description={description}
          features={features}
          disabled={isSubmitting}
          onSingularNameChange={setSingularName}
          onPluralNameChange={setPluralName}
          onDescriptionChange={setDescription}
          onFeaturesChange={setFeatures}
        />

        <SchemaFieldsList
          fields={fields}
          disabled={isSubmitting}
          onAddField={() => openFieldModal()}
          onEditField={openFieldModal}
          onDeleteField={removeField}
        />

        <FieldModal
          isOpen={fieldModalOpen}
          onClose={closeFieldModal}
          onSave={handleFieldSave}
          existingField={editingFieldIndex !== null ? fields[editingFieldIndex] : undefined}
          mode={editingFieldIndex !== null ? 'edit' : 'create'}
        />

        <SchemaSaveActions
          mode={mode}
          isSubmitting={isSubmitting}
          onCancel={() => router.push('/schemas')}
        />
      </form>
    </Container>
  );
}
