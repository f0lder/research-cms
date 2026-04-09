'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ContentTypeDefinition, ContentEntry, FieldDefinition, FieldValue } from '@research-cms/shared-types';
import { getSchema, getAllEntries, deleteEntry, duplicateEntry, bulkUpdateStatus, searchEntries, getTrash, restoreEntry, permanentlyDeleteEntry } from '@/app/actions';
import { extractParam, adminRoutes, formatDate, formatDateTime, getEntryTitle, truncateString } from '@/lib/utils';
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

    case 'references': {
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

// ── Status badge ───────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    draft: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
    published: { bg: 'bg-green-50', text: 'text-green-700' },
    scheduled: { bg: 'bg-blue-50', text: 'text-blue-700' },
    archived: { bg: 'bg-gray-50', text: 'text-gray-700' },
  };
  const style = colors[status ?? 'draft'] ?? colors['draft'];
  return (
    <span className={`text-xs px-2 py-1 rounded ${style.bg} ${style.text} font-mono font-semibold`}>
      {status ?? 'draft'}
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function SchemaDetailPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const params = useParams();
  const slug = extractParam(params, 'slug');

  const [schema, setSchema] = useState<ContentTypeDefinition | null>(null);
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [trashEntries, setTrashEntries] = useState<ContentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<'entries' | 'trash'>('entries');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [refCache, setRefCache] = useState<Record<string, ContentEntry>>({});

  // Column visibility — array of field.name + 'date' for the system date column
  const [visibleCols, setVisibleCols] = useState<string[]>([]);
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [schemaRes, entriesRes, trashRes] = await Promise.all([getSchema(slug), getAllEntries(slug), getTrash(slug)]);
    if (schemaRes.error) { setError(schemaRes.error); setLoading(false); return; }
    if (entriesRes.error) { setError(entriesRes.error); setLoading(false); return; }
    const schemaData = schemaRes.data ?? null;
    setSchema(schemaData);
    setEntries(entriesRes.data?.items ?? []);
    setTrashEntries(trashRes.data?.items ?? []);

    // Fetch referenced + media entries so cells can resolve IDs to values
    if (schemaData) {
      const refSlugs = [...new Set(
        schemaData.fields
          .filter(f => f.type === 'reference' || f.type === 'references')
          .map(f => (f.config?.type === 'reference' || f.config?.type === 'references') ? f.config.targetSlug : null)
          .filter((s): s is string => !!s)
      )];
      const hasMedia = schemaData.fields.some(f => f.type === 'media');
      const slugsToFetch = hasMedia ? [...refSlugs, 'media'] : refSlugs;

      if (slugsToFetch.length > 0) {
        const results = await Promise.all(slugsToFetch.map(s => getAllEntries(s)));
        const cache: Record<string, ContentEntry> = {};
        results.forEach(({ data }) => (data?.items ?? []).forEach(e => { if (e._id) cache[e._id] = e; }));
        setRefCache(cache);
      }
    }
    setLoading(false);
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
      const defaults = [...schema.fields.slice(0, 3).map(f => f.name), 'status', 'date'];
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

  const toggleSelected = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllSelected = () => {
    const curr = tab === 'entries' ? entries : trashEntries;
    if (selected.size === curr.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(curr.map(e => e._id).filter(Boolean) as string[]));
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) { setEntries(await getAllEntries(slug).then(r => r.data?.items ?? [])); return; }
    setSearching(true);
    const res = await searchEntries(slug, searchQuery);
    setSearching(false);
    if (res.error) alert(res.error);
    else setEntries(res.data?.items ?? []);
  };

  const handleDuplicate = async (id: string) => {
    const res = await duplicateEntry(slug, id);
    if (res.error) alert(res.error);
    else { alert('Entry duplicated!'); await load(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Move this entry to trash?')) return;
    const { error: err } = await deleteEntry(slug, id);
    if (err) alert(err);
    else { setEntries(prev => prev.filter(e => e._id !== id)); setTrashEntries(prev => [...prev, ...entries.filter(e => e._id === id)]); }
  };

  const handleRestore = async (id: string) => {
    const res = await restoreEntry(slug, id);
    if (res.error) alert(res.error);
    else { alert('Entry restored!'); await load(); }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Permanently delete? This cannot be undone.')) return;
    const res = await permanentlyDeleteEntry(slug, id);
    if (res.error) alert(res.error);
    else { alert('Entry permanently deleted'); setTrashEntries(prev => prev.filter(e => e._id !== id)); }
  };

  const handleBulkStatus = async () => {
    if (!bulkStatus || selected.size === 0) return;
    const ids = Array.from(selected);
    try {
      const res = await bulkUpdateStatus(slug, ids, bulkStatus as 'draft' | 'published' | 'scheduled' | 'archived');
      if (res.error) {
        console.error('Bulk update error:', res.error);
        alert('Error updating entries: ' + res.error);
        return;
      }
      console.log('Bulk update successful:', res.data);
      alert(`Updated ${ids.length} entries`);
      setSelected(new Set());
      setBulkStatus('');
      setSearchQuery(''); // Clear search to show all results after update
      await load(); // Reload to show updated statuses
    } catch (err) {
      console.error('Bulk update exception:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) return <div className="p-8 font-mono text-sm text-zinc-400">Loading…</div>;
  if (error || !schema) {
    return <div className="p-8"><div className="alert-error">{error || 'Schema not found'}</div></div>;
  }

  const visibleFields = schema.fields.filter(f => visibleCols.includes(f.name));
  const showStatus = visibleCols.includes('status');
  const showDate = visibleCols.includes('date');
  const currEntries = tab === 'entries' ? entries : trashEntries;

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
            </>
          )}
          <Link href={adminRoutes.contentCreate(slug)}>
            <button className="btn-primary">+ New entry</button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-zinc-200">
        <button
          onClick={() => { setTab('entries'); setSelected(new Set()); setSearchQuery(''); }}
          className={`px-4 py-2 text-sm font-medium transition ${tab === 'entries' ? 'text-blue-600 border-b-2 border-blue-600 -mb-0.5' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          Entries ({entries.length})
        </button>
        <button
          onClick={() => { setTab('trash'); setSelected(new Set()); }}
          className={`px-4 py-2 text-sm font-medium transition ${tab === 'trash' ? 'text-blue-600 border-b-2 border-blue-600 -mb-0.5' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          Trash ({trashEntries.length})
        </button>
      </div>

      {/* Search bar (visible on entries tab)  */}
      {tab === 'entries' && (
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search entries…"
              className="flex-1 field-input"
            />
            <button type="submit" disabled={searching} className="btn-secondary px-4">
              {searching ? 'Searching…' : 'Search'}
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={async () => { setSearchQuery(''); const r = await getAllEntries(slug); setEntries(r.data?.items ?? []); }}
                className="btn-ghost px-4"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      )}

      {currEntries.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-200 p-16 text-center">
          <p className="text-zinc-400 text-sm mb-4">
            {tab === 'trash' ? 'Trash is empty.' : 'No entries yet.'}
          </p>
          {tab === 'entries' && (
            <Link href={adminRoutes.contentCreate(slug)}>
              <button className="btn-secondary">Create first entry</button>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-zinc-200">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 gap-3 flex-wrap">
            <span className="text-xs text-zinc-400">
              {currEntries.length} {currEntries.length === 1 ? 'entry' : 'entries'}
              {selected.size > 0 && ` · ${selected.size} selected`}
            </span>

            {/* Bulk actions */}
            {selected.size > 0 && tab === 'entries' && (
              <div className="flex gap-2 items-center">
                <select
                  value={bulkStatus}
                  onChange={e => setBulkStatus(e.target.value)}
                  className="field-input text-xs py-1"
                >
                  <option value="">Set status to…</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
                <button
                  onClick={handleBulkStatus}
                  disabled={!bulkStatus}
                  className="btn-secondary text-xs px-3 py-1"
                >
                  Apply
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="btn-ghost text-xs px-3 py-1"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Column picker */}
            <div className="relative ml-auto" ref={pickerRef}>
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
                  <div className="border-t border-zinc-100 mt-1 pt-1">
                    <label className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-zinc-50 cursor-pointer text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={showStatus}
                        onChange={() => toggleCol('status')}
                        className="cursor-pointer"
                      />
                      Status
                      <span className="ml-auto text-[10px] text-zinc-300 font-mono">system</span>
                    </label>
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
                  <th className="px-4 py-2.5 text-left">
                    <input
                      type="checkbox"
                      checked={selected.size > 0 && selected.size === currEntries.length}
                      onChange={toggleAllSelected}
                      className="cursor-pointer"
                    />
                  </th>
                  {visibleFields.map(field => (
                    <th
                      key={field.name}
                      className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {field.label}
                    </th>
                  ))}
                  {showStatus && (
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                  )}
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
                {currEntries.map(entry => (
                  <tr
                    key={entry._id}
                    className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(entry._id || '')}
                        onChange={() => toggleSelected(entry._id || '')}
                        className="cursor-pointer"
                      />
                    </td>
                    {visibleFields.map(field => (
                      <td key={field.name} className="px-4 py-3 max-w-xs">
                        <CellValue value={entry.data[field.name]} field={field} refCache={refCache} />
                      </td>
                    ))}
                    {showStatus && (
                      <td className="px-4 py-3">
                        <StatusBadge status={entry.status} />
                      </td>
                    )}
                    {showDate && (
                      <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                        {entry.createdAt ? formatDate(entry.createdAt as string) : '—'}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {tab === 'entries' && (
                          <>
                            <Link href={adminRoutes.contentEdit(slug, entry._id ?? '')}>
                              <button className="btn-primary text-xs px-3 py-1">Edit</button>
                            </Link>
                            <button
                              onClick={() => handleDuplicate(entry._id || '')}
                              className="btn-secondary text-xs px-3 py-1"
                            >
                              Dup
                            </button>
                            <button
                              onClick={() => handleDelete(entry._id || '')}
                              className="btn-danger text-xs px-3 py-1"
                            >
                              Trash
                            </button>
                          </>
                        )}
                        {tab === 'trash' && (
                          <>
                            <button
                              onClick={() => handleRestore(entry._id || '')}
                              className="btn-secondary text-xs px-3 py-1"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(entry._id || '')}
                              className="btn-danger text-xs px-3 py-1"
                            >
                              Delete
                            </button>
                          </>
                        )}
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
