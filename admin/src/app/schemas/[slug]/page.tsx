'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ContentTypeDefinition, ContentEntry, FieldDefinition, FieldType, FieldValue } from '@research-cms/shared-types';
import { getSchema, getAllEntries, deleteEntry, formatDate, formatDateTime, getEntryTitle, extractParam, adminRoutes, truncateString } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// ── Cell renderer ──────────────────────────────────────────────────────────────
function CellValue({
  value, field, refCache,
}: {
  value: FieldValue | undefined;
  field: FieldDefinition;
  refCache: Record<string, ContentEntry>;
}) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-zinc-300">—</span>;
  }

  switch (field.type) {
    case FieldType.BOOLEAN:
      return value
        ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 font-mono">Yes</span>
        : <span className="text-xs bg-zinc-100 text-zinc-400 px-1.5 py-0.5 font-mono">No</span>;

    case FieldType.IMAGE:
      return (
        <img
          src={String(value)}
          alt=""
          className="h-8 w-auto object-contain"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      );

    case FieldType.REFERENCE: {
      const id = String(value);
      const targetSlug = field.config?.type === 'reference' ? field.config.targetSlug : '';
      const entry = refCache[id];
      const label = entry ? getEntryTitle(entry) : id.slice(-8);
      return (
        <Link href={adminRoutes.contentEdit(targetSlug, String(id))}
          className="text-blue-600 hover:underline text-sm">
          {label}
        </Link>
      );
    }

    case FieldType.REFERENCES: {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) return <span className="text-zinc-300">—</span>;
      const targetSlug = field.config?.type === 'references' ? field.config.targetSlug : '';
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

    case FieldType.TAGS: {
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

    case FieldType.SELECT:
      return <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 font-mono">{String(value)}</span>;

    case FieldType.DATE:
      return <span className="text-xs text-zinc-500">{formatDate(String(value))}</span>;

    case FieldType.DATETIME:
      return <span className="text-xs text-zinc-500">{formatDateTime(String(value))}</span>;

    case FieldType.NUMBER:
      return <span className="font-mono text-sm">{String(value)}</span>;

    case FieldType.EMAIL:
      return <a href={`mailto:${value}`} className="text-blue-600 hover:underline text-sm truncate max-w-xs block">{String(value)}</a>;

    case FieldType.URL:
      return <a href={String(value)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-xs block">{String(value)}</a>;

    default: {
      return <span className="text-zinc-700 text-sm">{truncateString(value)}</span>;
    }
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function SchemaDetailPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const params = useParams();
  const slug = extractParam(params, 'slug');

  const [schema, setSchema] = useState<ContentTypeDefinition | null>(null);
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refCache, setRefCache] = useState<Record<string, ContentEntry>>({});

  // Column visibility — array of field.name + 'date' for the system date column
  const [visibleCols, setVisibleCols] = useState<string[]>([]);
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [schemaRes, entriesRes] = await Promise.all([getSchema(slug), getAllEntries(slug)]);
    if (schemaRes.error) { setError(schemaRes.error); setLoading(false); return; }
    const schemaData = schemaRes.data ?? null;
    setSchema(schemaData);
    setEntries(entriesRes.data ?? []);
    setLoading(false);

    // Fetch referenced entries so cells can show titles instead of IDs
    if (schemaData) {
      const targetSlugs = [...new Set(
        schemaData.fields
          .filter(f => f.type === FieldType.REFERENCE || f.type === FieldType.REFERENCES)
          .map(f => (f.config?.type === 'reference' || f.config?.type === 'references') ? f.config.targetSlug : null)
          .filter((s): s is string => !!s)
      )];
      if (targetSlugs.length > 0) {
        const results = await Promise.all(targetSlugs.map(s => getAllEntries(s)));
        const cache: Record<string, ContentEntry> = {};
        results.forEach(({ data }) => (data ?? []).forEach(e => { if (e._id) cache[e._id] = e; }));
        setRefCache(cache);
      }
    }
  }, [slug]);

  useEffect(() => { if (slug) load(); }, [slug, load]);

  // Init visible columns from localStorage once schema is known
  useEffect(() => {
    if (!schema) return;
    const saved = typeof window !== 'undefined'
      ? localStorage.getItem(`cms_cols_${schema._id}`)
      : null;
    if (saved) {
      setVisibleCols(JSON.parse(saved) as string[]);
    } else {
      const defaults = [...schema.fields.slice(0, 4).map(f => f.name), 'date'];
      setVisibleCols(defaults);
    }
  }, [schema, slug]);

  // Close picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setColPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleCol = (key: string) => {
    setVisibleCols(prev => {
      const next = prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key];
      localStorage.setItem(`cms_cols_${schema?._id}`, JSON.stringify(next));
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    setDeletingId(id);
    const { error: err } = await deleteEntry(slug, id);
    if (err) alert(err);
    else setEntries(prev => prev.filter(e => e._id !== id));
    setDeletingId(null);
  };

  if (loading) return <div className="p-8 font-mono text-sm text-zinc-400">Loading…</div>;
  if (error || !schema) {
    return <div className="p-8"><div className="alert-error">{error || 'Schema not found'}</div></div>;
  }

  const visibleFields = schema.fields.filter(f => visibleCols.includes(f.name));
  const showDate = visibleCols.includes('date');

  return (
    <div className="p-8 font-mono">
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
              <Link href={adminRoutes.schemaEdit(slug)}>
                <button className="btn-secondary">Edit schema</button>
              </Link>
              <Link href={adminRoutes.schemaLayout(slug)}>
                <button className="btn-secondary">Block layout</button>
              </Link>
            </>
          )}
          <Link href={adminRoutes.contentCreate(slug)}>
            <button className="btn-primary">+ New entry</button>
          </Link>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-200 p-16 text-center">
          <p className="text-zinc-400 text-sm mb-4">No entries yet.</p>
          <Link href={adminRoutes.contentCreate(slug)}>
            <button className="btn-secondary">Create first entry</button>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200">
          {/* Table toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <span className="text-xs text-zinc-400">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>

            {/* Column picker */}
            <div className="relative" ref={pickerRef}>
              <button
                onClick={() => setColPickerOpen(o => !o)}
                className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                Columns
                <span className="text-zinc-400">{colPickerOpen ? '▲' : '▼'}</span>
              </button>

              {colPickerOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-zinc-200 shadow-sm z-10 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 px-3 pb-2 border-b border-zinc-100 mb-1">
                    Visible columns
                  </p>
                  {schema.fields.map(field => (
                    <label
                      key={field.name}
                      className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-zinc-50 cursor-pointer text-sm text-zinc-700"
                    >
                      <input
                        type="checkbox"
                        checked={visibleCols.includes(field.name)}
                        onChange={() => toggleCol(field.name)}
                        className="cursor-pointer"
                      />
                      {field.label}
                      <span className="ml-auto text-[10px] text-zinc-300 font-mono">{field.type}</span>
                    </label>
                  ))}
                  {/* System column: date */}
                  <div className="border-t border-zinc-100 mt-1 pt-1">
                    <label className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-zinc-50 cursor-pointer text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={showDate}
                        onChange={() => toggleCol('date')}
                        className="cursor-pointer"
                      />
                      Date
                      <span className="ml-auto text-[10px] text-zinc-300 font-mono">system</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  {visibleFields.map(field => (
                    <th
                      key={field.name}
                      className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {field.label}
                    </th>
                  ))}
                  {showDate && (
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                      Date
                    </th>
                  )}
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr
                    key={entry._id}
                    className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                  >
                    {visibleFields.map(field => (
                      <td key={field.name} className="px-4 py-3 max-w-xs">
                        <CellValue value={entry.data[field.name]} field={field} refCache={refCache} />
                      </td>
                    ))}
                    {showDate && (
                      <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                        {entry.createdAt ? formatDate(entry.createdAt as string) : '—'}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link href={adminRoutes.contentEdit(slug, entry._id ?? '')}>
                          <button className="btn-primary text-xs px-3 py-1">Edit</button>
                        </Link>
                        <button
                          onClick={() => entry._id && handleDelete(entry._id)}
                          disabled={deletingId === entry._id}
                          className="btn-danger text-xs px-3 py-1"
                        >
                          {deletingId === entry._id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
