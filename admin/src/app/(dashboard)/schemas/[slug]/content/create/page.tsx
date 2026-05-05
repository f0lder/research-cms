'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ContentTypeDefinition, ContentEntry } from '@research-cms/shared-types';
import { extractParam, adminRoutes } from '@/lib/utils';
import { getSchema } from '@/app/actions';
import ContentForm from '@/components/content/ContentForm';
import { useToast } from '@/contexts/ToastContext';

export default function ContentCreatePage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const slug = extractParam(params, 'slug');

  const [schema, setSchema] = useState<ContentTypeDefinition | null>(null);
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

  if (loading) return <div className="page text-sm text-zinc-400">Loading…</div>;

  if (error || !schema) {
    return (
      <div className="page">
        <div className="alert-error">{error || 'Schema not found'}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <p className="breadcrumb">
        <Link href="/schemas">Content Types</Link>
        <span className="mx-1">/</span>
        <Link href={adminRoutes.schemaDetail(slug)}>{schema.name}</Link>
        <span className="mx-1">/</span>
        New entry
      </p>

      <h1 className="page-heading mb-8">New {schema.name}</h1>

      <ContentForm
        mode="create"
        schema={schema}
        onSuccess={(createdEntry: ContentEntry) => {
          showToast(`${schema.name} created successfully`, 'success');
          // Navigate to the edit page for the newly created entry
          if (createdEntry._id) {
            router.push(adminRoutes.contentEdit(slug, createdEntry._id.toString()));
          } else {
            // Fallback to schema detail if ID wasn't returned
            router.push(adminRoutes.schemaDetail(slug));
          }
        }}
      />
    </div>
  );
}
