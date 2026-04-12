import Link from 'next/link';
import { ContentTypeDefinition } from '@research-cms/shared-types';

interface PageHeaderProps {
  schema: ContentTypeDefinition;
  slug: string;
  isAdmin: boolean;
}

export function EntryListPageHeader({ schema, slug, isAdmin }: PageHeaderProps) {
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
        <div className="flex gap-2">
          {isAdmin && (
            <>
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
    </>
  );
}
