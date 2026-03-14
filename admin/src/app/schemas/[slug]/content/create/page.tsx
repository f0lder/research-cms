'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { getSchema } from '../../../../../lib/utils';
import ContentForm from '../../../../../components/content/ContentForm';

export default function ContentCreatePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug ? (Array.isArray(params.slug) ? params.slug[0] : params.slug) : '';

  const [schema, setSchema] = useState<ContentTypeDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    getSchema(slug).then(({ data, error: err }) => {
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

  return (
    <div className="page">
      <p className="breadcrumb">
        <Link href="/schemas">Content Types</Link>
        <span className="mx-1">/</span>
        <Link href={`/schemas/${slug}`}>{schema.name}</Link>
        <span className="mx-1">/</span>
        New entry
      </p>

      <h1 className="page-heading mb-8">New {schema.name}</h1>

      <ContentForm
        mode="create"
        schema={schema}
        onSuccess={() => router.push(`/schemas/${slug}`)}
      />
    </div>
  );
}
