'use client';
import Link from 'next/link';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSchemas } from '@/contexts/SchemaContext';

function SchemaRow({ schema, isAdmin }: { schema: ContentTypeDefinition; isAdmin: boolean }) {
  return (
    <div className="panel flex items-center justify-between">
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
        {!schema.system && (
          <Link href={`/schemas/${schema.slug}`}>
            <button className="btn-secondary text-xs px-3 py-1.5">Entries</button>
          </Link>
        )}
        {isAdmin && !schema.system && (
          <Link href={`/schemas/edit/${schema.slug}`}>
            <button className="btn-primary text-xs px-3 py-1.5">Edit</button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function SchemasPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { schemas, systemSchemas, loading, error } = useSchemas();

  if (loading) return <div className="p-8 font-mono text-sm text-zinc-400">Loading…</div>;
  if (error) return <div className="p-8"><div className="alert-error">{error}</div></div>;

  return (
    <div className="page">
      {/* User-defined schemas */}
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
        <div className="flex flex-col gap-3 mb-12">
          {schemas.map(schema => (
            <SchemaRow key={schema._id} schema={schema} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {/* System schemas */}
      {systemSchemas.length > 0 && (
        <>
          <div className="mb-4">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">System Types</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Built-in schemas managed by the CMS — read only.</p>
          </div>
          <div className="flex flex-col gap-3">
            {systemSchemas.map(schema => (
              <SchemaRow key={schema._id} schema={schema} isAdmin={isAdmin} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
