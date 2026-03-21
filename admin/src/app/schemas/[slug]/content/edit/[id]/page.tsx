'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ContentTypeDefinition, ContentEntry } from '@research-cms/shared-types';
import { getSchema, getEntry, extractParam, adminRoutes } from '../../../../../../lib/utils';
import ContentForm from '../../../../../../components/content/ContentForm';

export default function ContentEditPage() {
  const params = useParams();
  const router = useRouter();
  const slug = extractParam(params, 'slug');
  const id   = extractParam(params, 'id');

  const [schema, setSchema] = useState<ContentTypeDefinition | null>(null);
  const [entry, setEntry] = useState<ContentEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug || !id) return;
    Promise.all([getSchema(slug), getEntry(slug, id)]).then(([schemaRes, entryRes]) => {
      if (schemaRes.error) { setError(schemaRes.error); setLoading(false); return; }
      if (entryRes.error) { setError(entryRes.error); setLoading(false); return; }
      if (schemaRes.data) setSchema(schemaRes.data);
      if (entryRes.data) setEntry(entryRes.data);
      setLoading(false);
    });
  }, [slug, id]);

  if (loading) return <div className="p-8 font-mono text-sm text-zinc-400">Loading…</div>;

  if (error || !schema || !entry) {
    return (
      <div className="p-8">
        <div className="alert-error">{error || 'Entry not found'}</div>
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
        Edit entry
      </p>

      <h1 className="page-heading mb-8">Edit {schema.name}</h1>

      <ContentForm
        mode="edit"
        schema={schema}
        initialData={entry}
        onSuccess={() => router.push(adminRoutes.schemaDetail(slug))}
      />
    </div>
  );
}
