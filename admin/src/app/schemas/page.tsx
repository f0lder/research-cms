'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { getAllSchemas, formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function SchemasPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [schemas, setSchemas] = useState<ContentTypeDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllSchemas().then(({ data }) => {
      if (data) setSchemas(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 font-mono text-sm text-zinc-400">Loading…</div>;

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-heading">Content Types</h1>
          <p className="page-sub">{schemas.length} schema{schemas.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <Link href="/schemas/create">
            <button className="btn-primary">+ New Schema</button>
          </Link>
        )}
      </div>

      {schemas.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-200 p-16 text-center">
          <p className="text-zinc-400 text-sm mb-4">No schemas created yet.</p>
          {isAdmin && (
            <Link href="/schemas/create">
              <button className="btn-secondary">Create your first schema</button>
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {schemas.map(schema => (
            <div key={schema._id} className="panel flex items-center justify-between">
              <div>
                <Link href={`/schemas/${schema.slug}`} className="no-underline">
                  <h3 className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 cursor-pointer mb-1">
                    {schema.name}
                  </h3>
                </Link>
                <p className="text-xs text-zinc-400 mb-1">/{schema.slug}</p>
                <p className="text-xs text-zinc-500">
                  {schema.fields.length} field{schema.fields.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-300">
                  {schema.createdAt ? formatDate(schema.createdAt) : ''}
                </span>
                <Link href={`/schemas/${schema.slug}`}>
                  <button className="btn-secondary text-xs px-3 py-1.5">Entries</button>
                </Link>
                {isAdmin && (
                  <Link href={`/schemas/edit/${schema.slug}`}>
                    <button className="btn-primary text-xs px-3 py-1.5">Edit</button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
