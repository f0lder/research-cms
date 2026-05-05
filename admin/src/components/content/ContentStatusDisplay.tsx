'use client';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { Card, Heading, Text } from '@/components/ui';
import { HiExclamationTriangle } from 'react-icons/hi2';

export function ContentStatusDisplay({ status, publishedAt, schema }: {
  status: 'draft' | 'published';
  publishedAt?: string;
  schema: ContentTypeDefinition;
}) {
  return (
    <div className="mt-8 space-y-4">
      <Heading level={3}>Status</Heading>

      <Card variant="outlined">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Text variant="body-sm">Current:</Text>
            <span className="font-bold uppercase px-2 py-1 border-2 border-on-surface bg-surface-container">{status}</span>
          </div>

          {publishedAt && (
            <Text variant="body-sm">
              Published: {new Date(publishedAt).toLocaleString()}
            </Text>
          )}

          {schema.features?.drafts === false && (
            <Card variant="filled" className="border-2 border-warning bg-surface-container-low flex flex-row gap-2 items-center">
              <HiExclamationTriangle className="text-lg" />
              <Text variant="body-sm">
                <b>Drafts Disabled:</b> Entries must be published immediately.
              </Text>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
}
