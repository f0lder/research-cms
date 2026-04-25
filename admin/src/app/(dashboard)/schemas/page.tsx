'use client';
import Link from 'next/link';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSchemas } from '@/contexts/SchemaContext';
import { Button, Heading, Text, Card } from '@/components/ui';

function SchemaRow({ schema, isAdmin }: { schema: ContentTypeDefinition; isAdmin: boolean }) {
  return (
    <Card variant="elevated">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/schemas/${schema.slug}`} className="no-underline">
            <Heading level={3} className="mb-1 hover:text-primary">
              {schema.name}
            </Heading>
          </Link>
          <Text variant="code" color="secondary" className="mb-1">/{schema.slug}</Text>
          <Text variant="caption" color="secondary">
            {schema.fields.length} field{schema.fields.length !== 1 ? 's' : ''}
          </Text>
        </div>

        <div className="flex items-center gap-3">
          <Text variant="caption" color="secondary">
            {schema.createdAt ? formatDate(schema.createdAt) : ''}
          </Text>
          {!schema.system && (
            <Link href={`/schemas/${schema.slug}`}>
              <Button as="span" variant="secondary" size="sm">Entries</Button>
            </Link>
          )}
          {isAdmin && !schema.system && (
            <Link href={`/schemas/edit/${schema.slug}`}>
              <Button as="span" variant="primary" size="sm">Edit</Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function SchemasPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { schemas, systemSchemas, loading, error } = useSchemas();

  if (loading) return <div className="page"><Text variant="caption" color="secondary">Loading…</Text></div>;
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
