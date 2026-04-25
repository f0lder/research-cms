'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { extractParam } from '@/lib/utils';
import { getSchema } from '@/app/actions';
import SchemaForm from '@/components/schemas/SchemaForm';
import { FormSkeleton } from '@/components/skeletons';

export default function EditSchemaPage() {
  const params = useParams();
  const slug = extractParam(params, 'slug');

  const [schema, setSchema] = useState<ContentTypeDefinition | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const { data, error: err } = await getSchema(slug);
        if (err) setError(err);
        else if (data) setSchema(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load schema');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <FormSkeleton />;

  if (error || !schema) {
    return (
      <div className="page">
        <div className="alert-error">{error || 'Schema not found'}</div>
      </div>
    );
  }

  return <SchemaForm mode="edit" initialData={schema} />;
}
