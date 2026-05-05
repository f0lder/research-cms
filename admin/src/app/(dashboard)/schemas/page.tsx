'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSchemas } from '@/contexts/SchemaContext';
import { Button, Heading, Text } from '@/components/ui';
import { ListSkeleton, PageHeaderSkeleton } from '@/components/skeletons';
import { SchemaRow } from '@/components/schemas/SchemaRow';

export default function SchemasPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { schemas, systemSchemas, loading, error } = useSchemas();

  if (loading) return (
    <div className='page'>
      <PageHeaderSkeleton />
      <ListSkeleton items={5} />;
      <PageHeaderSkeleton />
      <ListSkeleton items={3} />;
    </div>
  );

  if (error) return <div className="page"><div className="alert-error">{error}</div></div>;

  return (
    <div className="page">
      {/* User-defined schemas */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Heading level={1} className="mb-1">Content Types</Heading>
          <Text variant="caption" color="secondary">{schemas.length} schema{schemas.length !== 1 ? 's' : ''}</Text>
        </div>
        {isAdmin && (
          <Link href="/schemas/create">
            <Button as="span" variant="primary" size="md">
              + New Schema
            </Button>
          </Link>
        )}
      </div>

      {schemas.length === 0 ? (
        <div className="border-2 border-dashed border-on-surface p-16 text-center">
          <Text variant="caption" color="secondary" className="mb-4 block">No schemas created yet.</Text>
          {isAdmin && (
            <Link href="/schemas/create">
              <Button as="span" variant="secondary" size="md">
                Create your first schema
              </Button>
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
            <Text variant="label" color="secondary" className="uppercase block">System Types</Text>
            <Text variant="caption" color="secondary" className="mt-0.5">Built-in schemas managed by the CMS — read only.</Text>
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
