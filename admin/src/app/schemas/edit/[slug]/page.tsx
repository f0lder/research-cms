'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { api } from '../../../../lib/utils';
import SchemaForm from '../../../../components/schemas/SchemaForm';

export default function EditSchemaPage() {
  const params = useParams();
  const slug = params?.slug ? (Array.isArray(params.slug) ? params.slug[0] : params.slug) : '';

  const [schema, setSchema] = useState<ContentTypeDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    api.get<ContentTypeDefinition>(`/schemas/${slug}`).then(({ data, error: err }) => {
      if (err) setError(err);
      else if (data) setSchema(data);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="p-8 font-mono text-sm text-zinc-400">Loading…</div>;

  if (error || !schema) {
    return (
      <div className="p-8">
        <div className="alert-error">{error || 'Schema not found'}</div>
      </div>
    );
  }

  return <SchemaForm mode="edit" initialData={schema} />;
}
