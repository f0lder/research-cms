'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { rebuildIndex } from '@/app/actions';
import { API_URL } from '@/config';
import { Button, Heading, Text, Badge, Breadcrumb } from '@/components/ui';
import { LuDatabase } from 'react-icons/lu';

interface PageHeaderProps {
  schema: ContentTypeDefinition;
  slug: string;
  isAdmin: boolean;
}

export function EntryListPageHeader({ schema, slug, isAdmin }: PageHeaderProps) {
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
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
  };

  const handleExportCsv = async () => {
    setExportLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${API_URL}/content/${slug}/export/csv`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Export failed' }));
        setRebuildMessage(`✗ ${err.message || 'Export failed'}`);
        setTimeout(() => setRebuildMessage(''), 3000);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slug}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setRebuildMessage('✓ CSV exported successfully');
      setTimeout(() => setRebuildMessage(''), 3000);
    } catch (error) {
      setRebuildMessage('✗ Failed to export CSV');
      setTimeout(() => setRebuildMessage(''), 3000);
    } finally {
      setExportLoading(false);
    }
  };
  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Schemas', href: '/schemas', icon: LuDatabase },
          { label: schema.name },
        ]}
      />

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Heading level={1} className="page-heading">
            {schema.singularName || schema.name}
            {schema.pluralName && <span className="text-sm font-normal text-zinc-500 ml-2">({schema.pluralName})</span>}
          </Heading>
          <Text>/{schema.slug} · {schema.fields.length} field{schema.fields.length !== 1 ? 's' : ''}</Text>
          {schema.description && (
            <Text className="text-sm text-zinc-600 mt-1">{schema.description}</Text>
          )}
          {schema.features && (
            <div className="flex gap-2 mt-2">
              {schema.features.drafts && <Badge status="draft" size="xs" />}
              {schema.features.revisions && <Badge status="revisions" size="xs" />}
              {schema.features.search && <Badge status="search" size="xs" />}
              {schema.features.seo && <Badge status="seo" size="xs" />}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {rebuildMessage && (
            <span
              className={`text-sm ${rebuildMessage.startsWith('✓') ? 'text-green-600' : 'text-error'}`}
            >
              {rebuildMessage}
            </span>
          )}
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button
                  onClick={handleRebuildIndex}
                  disabled={rebuildLoading}
                  variant="secondary"
                  size='sm'
                  title="Rebuild search indices for existing entries"
                >
                  {rebuildLoading ? 'Rebuilding…' : 'Rebuild Index'}
                </Button>
                <Button
                  onClick={handleExportCsv}
                  disabled={exportLoading}
                  variant="secondary"
                  size='sm'
                  title="Download CSV export"
                >
                  {exportLoading ? 'Exporting…' : 'Export CSV'}
                </Button>
                <Link href={`/schemas/edit/${slug}`}>
                  <Button variant="secondary" size='sm'>
                    Edit schema
                  </Button>
                </Link>
              </>
            )}
            <Link href={`/schemas/${slug}/content/create`}>
              <Button variant="primary" size='sm'>
                + New entry
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
