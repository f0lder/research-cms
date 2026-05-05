'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ContentTypeDefinition, ContentEntry } from '@research-cms/shared-types';
import { extractParam, adminRoutes } from '@/lib/utils';
import { getSchema, getEntry } from '@/app/actions';
import ContentForm from '@/components/content/ContentForm';
import { VersionHistory } from '@/components/content/VersionHistory';
import { FormSkeleton } from '@/components/skeletons';
import { useToast } from '@/contexts/ToastContext';

export default function ContentEditPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const slug = extractParam(params, 'slug');
  const id   = extractParam(params, 'id');

  const [schema, setSchema] = useState<ContentTypeDefinition | undefined>(undefined);
  const [entry, setEntry] = useState<ContentEntry | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug || !id) return;
    (async () => {
      const [schemaRes, entryRes] = await Promise.all([getSchema(slug), getEntry(slug, id)]);
      if (schemaRes.error) { setError(schemaRes.error); setLoading(false); return; }
      if (entryRes.error) { setError(entryRes.error); setLoading(false); return; }
      if (schemaRes.data) setSchema(schemaRes.data);
      if (entryRes.data) setEntry(entryRes.data);
      setLoading(false);
    })().catch((err) => {
      setError(`Error loading data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    });
  }, [slug, id]);

  if (loading) {
    return (
      <div className="page">
        <div className="mb-8 space-y-2 w-1/2">
          <div className="h-6 bg-zinc-200 rounded animate-pulse" />
          <div className="h-4 bg-zinc-100 rounded animate-pulse" />
        </div>
        <FormSkeleton />
      </div>
    );
  }
  
  if (error || !schema || !entry) {
    return (
      <div className="page">
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
        onSuccess={(updatedEntry) => {
          // Update local state with the saved entry instead of navigating
          if (updatedEntry) {
            setEntry(updatedEntry);
          }
        }}
      />

      {schema.features?.revisions && (
        <VersionHistory
          schemaSlug={slug}
          entryId={entry._id ?? ''}
          currentVersion={entry.version ?? 1}
          onRestore={async () => {
            // Fetch the restored entry without reloading the page
            const { data, error } = await getEntry(slug, id);
            if (error) {
              showToast('Failed to load restored version', 'error');
            } else if (data) {
              setEntry(data);
              showToast('Version restored', 'success');
            }
          }}
        />
      )}
    </div>
  );
}
