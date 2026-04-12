'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { rebuildIndex } from '@/app/actions';

interface PageHeaderProps {
  schema: ContentTypeDefinition;
  slug: string;
  isAdmin: boolean;
}

export function EntryListPageHeader({ schema, slug, isAdmin }: PageHeaderProps) {
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [rebuildMessage, setRebuildMessage] = useState('');

  const handleRebuildIndex = async () => {
    if (!confirm('Rebuild search indices for all entries in this schema?')) return;
    setRebuildLoading(true);
    try {
      const res = await rebuildIndex(slug);
      if (res.error) {
        setRebuildMessage(`✗ ${res.error}`);
      } else {
        setRebuildMessage(`✓ ${res.data?.message}`);
      }
      setTimeout(() => setRebuildMessage(''), 3000);
    } catch (error) {
      setRebuildMessage(`✗ Failed to rebuild indices`);
      setTimeout(() => setRebuildMessage(''), 3000);
    } finally {
      setRebuildLoading(false);
    }
  }
  return (
    <>
      {/* Breadcrumb */}
      <p className="breadcrumb">
        <Link href="/schemas">Content Types</Link>
        <span className="mx-1">/</span>
        {schema.name}
      </p>

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-heading">{schema.name}</h1>
          <p className="page-sub">/{schema.slug} · {schema.fields.length} field{schema.fields.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {rebuildMessage && (
            <span
              className="text-sm"
              style={rebuildMessage.startsWith('✓') ? { color: '#16a34a' } : { color: '#dc2626' }}
            >
              {rebuildMessage}
            </span>
          )}
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={handleRebuildIndex}
                  disabled={rebuildLoading}
                  className="btn-secondary text-xs"
                  title="Rebuild search indices for existing entries"
                >
                  {rebuildLoading ? 'Rebuilding…' : 'Rebuild Index'}
                </button>
                <Link href={`/schemas/edit/${slug}`}>
                  <button className="btn-secondary">Edit schema</button>
                </Link>
              </>
            )}
            <Link href={`/schemas/${slug}/content/create`}>
              <button className="btn-primary">+ New entry</button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
