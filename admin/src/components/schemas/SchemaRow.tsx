'use client';
import Link from 'next/link';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { formatDate } from '@/lib/utils';
import { Button, Heading, Text, Card } from '@/components/ui';

interface SchemaRowProps {
  schema: ContentTypeDefinition;
  isAdmin: boolean;
}

export function SchemaRow({ schema, isAdmin }: SchemaRowProps) {
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

