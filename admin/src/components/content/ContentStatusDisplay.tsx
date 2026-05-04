'use client';
import { ContentTypeDefinition, ContentEntry } from '@research-cms/shared-types';

interface ContentStatusDisplayProps {
  status: 'draft' | 'published';
  publishedAt?: string;
  schema: ContentTypeDefinition;
}

export function ContentStatusDisplay({ status, publishedAt, schema }: ContentStatusDisplayProps) {
  return (
    <div className="mt-8 pt-6 border-t border-zinc-200">
      <h3 className="text-sm font-semibold text-zinc-700 mb-4">Status</h3>
      <div className="text-sm text-zinc-600 mb-4">
        Current: <span className="font-bold uppercase">{status}</span>
      </div>
      {publishedAt && (
        <div className="text-xs text-zinc-500 mb-4">
          Published: {new Date(publishedAt).toLocaleString()}
        </div>
      )}
      {schema.features?.drafts === false && (
        <div className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 p-2 rounded mb-4">
          <strong>Note:</strong> Drafts are disabled for this schema. Entries must be published
          immediately.
        </div>
      )}
    </div>
  );
}
