'use client';

import Link from 'next/link';
import { ContentTypeDefinition } from '@research-cms/shared-types';

interface SchemasListProps {
  schemas: (ContentTypeDefinition & { entryCount?: number })[];
}

export default function SchemasList({ schemas }: SchemasListProps) {
  if (schemas.length === 0) {
    return (
      <div className="panel text-center py-8">
        <p className="text-xs text-zinc-400">No content types yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {schemas.map((schema) => (
        <Link key={schema._id} href={`/schemas/${schema.slug}`} className="no-underline">
          <div className="panel hover:bg-zinc-50 cursor-pointer transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-zinc-900">{schema.name}</h3>
                <div className="flex gap-4 mt-1">
                  <span className="text-xs text-zinc-400">
                    {schema.fields.length} field{schema.fields.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {schema.entryCount || 0} entr{schema.entryCount === 1 ? 'y' : 'ies'}
                  </span>
                </div>
              </div>
              <span className="text-xs text-zinc-300">→</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
