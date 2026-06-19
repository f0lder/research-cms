'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ContentTypeDefinition, ContentEntry } from '@research-cms/shared-types';
import { extractParam, adminRoutes } from '@/lib/utils';
import { getSchema } from '@/app/actions';
import ContentForm from '@/components/content/ContentForm';
import { useToast } from '@/contexts/ToastContext';
import { Breadcrumb } from '@/components/ui';
import { LuDatabase, LuFilePlus } from 'react-icons/lu';

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
      <Breadcrumb
        items={[
          { label: 'Schemas', href: '/schemas', icon: LuDatabase },
          { label: schema.name, href: adminRoutes.schemaDetail(slug) },
          { label: 'New entry', icon: LuFilePlus },
        ]}
      />

      <h1 className="page-heading mb-8">New {schema.name}</h1>

      <ContentForm
        mode="create"
        schema={schema}
        onSuccess={(createdEntry?: ContentEntry) => {
          showToast(`${schema.name} created successfully`, 'success');
          if (createdEntry?._id) {
            router.push(adminRoutes.contentEdit(slug, createdEntry._id.toString()));
          } else {
            router.push(adminRoutes.schemaDetail(slug));
          }
        }}
      />
    </div>
  );
}
