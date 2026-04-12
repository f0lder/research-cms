import Link from 'next/link';
import { ContentEntry, FieldDefinition, FieldValue } from '@research-cms/shared-types';
import { adminRoutes, formatDate, formatDateTime, getEntryTitle, truncateString } from '@/lib/utils';

interface CellValueProps {
  value: FieldValue | undefined;
  field: FieldDefinition;
  refCache: Record<string, ContentEntry>;
}

export function CellValue({ value, field, refCache }: CellValueProps) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-zinc-300">—</span>;
  }

  switch (field.type) {
    case 'boolean':
      return value
        ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 font-mono">Yes</span>
        : <span className="text-xs bg-zinc-100 text-zinc-400 px-1.5 py-0.5 font-mono">No</span>;

    case 'media': {
      const mediaUrl = refCache[String(value)]?.data?.url;
      if (!mediaUrl) return <span className="text-zinc-300 text-xs font-mono">—</span>;
      return (
        <img
          src={String(mediaUrl)}
          alt=""
          className="h-8 w-auto object-contain"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      );
    }

    case 'reference': {
      const id = String(value);
      const targetSlug = field.config?.type === 'reference' && 'targetSlug' in field.config 
        ? String(field.config.targetSlug) 
        : '';
      const entry = refCache[id];
      const label = entry ? getEntryTitle(entry) : id.slice(-8);
      return (
        <Link href={adminRoutes.contentEdit(targetSlug, String(id))}
          className="text-blue-600 hover:underline text-sm">
          {label}
        </Link>
      );
    }

    case 'references': {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) return <span className="text-zinc-300">—</span>;
      const targetSlug = field.config?.type === 'references' && 'targetSlug' in field.config
        ? String(field.config.targetSlug)
        : '';
      return (
        <div className="flex flex-wrap gap-1">
          {arr.slice(0, 3).map((id, i) => {
            const entry = refCache[String(id)];
            const label = entry ? getEntryTitle(entry) : String(id).slice(-8);
            return (
              <Link key={i} href={adminRoutes.contentEdit(targetSlug, String(id))}
                className="text-xs bg-zinc-100 text-blue-600 hover:bg-zinc-200 px-1.5 py-0.5 font-mono">
                {label}
              </Link>
            );
          })}
          {arr.length > 3 && <span className="text-xs text-zinc-400">+{arr.length - 3}</span>}
        </div>
      );
    }

    case 'tags': {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) return <span className="text-zinc-300">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {arr.slice(0, 3).map((v, i) => (
            <span key={i} className="text-xs bg-zinc-100 text-zinc-600 px-1.5 py-0.5 font-mono">{String(v)}</span>
          ))}
          {arr.length > 3 && <span className="text-xs text-zinc-400">+{arr.length - 3}</span>}
        </div>
      );
    }

    case 'select':
      return <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 font-mono">{String(value)}</span>;

    case 'date':
      return <span className="text-xs text-zinc-500">{formatDate(String(value))}</span>;

    case 'datetime':
      return <span className="text-xs text-zinc-500">{formatDateTime(String(value))}</span>;

    case 'number':
      return <span className="font-mono text-sm">{String(value)}</span>;

    case 'email':
      return <a href={`mailto:${value}`} className="text-blue-600 hover:underline text-sm truncate max-w-xs block">{String(value)}</a>;

    case 'url':
      return <a href={String(value)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-xs block">{String(value)}</a>;

    default: {
      return <span className="text-zinc-700 text-sm">{truncateString(value)}</span>;
    }
  }
}
