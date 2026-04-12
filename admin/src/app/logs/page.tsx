'use client';
import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { LogEntry } from '@research-cms/shared-types';
import { formatDateTime } from '@/lib/utils';
import { getLogs, getLogTags, clearLogs } from '@/app/actions';
import { TableSkeleton } from '@/components/skeletons';

// ── Tag styling ───────────────────────────────────────────────────────────────
const TAG_STYLES: Record<string, string> = {
  error:    'bg-red-100 text-red-700',
  auth:     'bg-blue-100 text-blue-700',
  login:    'bg-blue-50 text-blue-600',
  register: 'bg-purple-100 text-purple-700',
  content:  'bg-green-100 text-green-700',
  create:   'bg-green-50 text-green-600',
  update:   'bg-yellow-100 text-yellow-700',
  delete:   'bg-red-50 text-red-600',
  schema:   'bg-orange-100 text-orange-700',
  'api-key':'bg-zinc-200 text-zinc-700',
  'public-api': 'bg-indigo-100 text-indigo-700',
};

function TagBadge({ tag }: { tag: string }) {
  const cls = TAG_STYLES[tag] ?? 'bg-zinc-100 text-zinc-600';
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 ${cls}`}>
      {tag}
    </span>
  );
}

// ── Meta viewer ───────────────────────────────────────────────────────────────
function MetaCell({ meta }: { meta?: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false);
  if (!meta || Object.keys(meta).length === 0) return <span className="text-zinc-300">—</span>;
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="text-[10px] text-zinc-400 hover:text-zinc-600 font-mono border border-zinc-200 px-1.5 py-0.5"
      >
        {open ? 'hide' : 'meta'}
      </button>
      {open && (
        <pre className="mt-1 text-[10px] font-mono text-zinc-600 bg-zinc-50 border border-zinc-100 p-2 whitespace-pre-wrap max-w-xs">
          {JSON.stringify(meta, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;

type Option = { value: string; label: string };

export default function LogsPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [selectedTags, debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [logsRes, tagsRes] = await Promise.all([
      getLogs({ tags: selectedTags, search: debouncedSearch, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
      getLogTags(),
    ]);
    if (logsRes.error) { setError(logsRes.error); setLoading(false); return; }
    setEntries(logsRes.data?.entries ?? []);
    setTotal(logsRes.data?.total ?? 0);
    setAllTags(tagsRes.data ?? []);
    setLoading(false);
  }, [selectedTags, debouncedSearch, page]);

  useEffect(() => { load(); }, [load]);

  const handleClear = async () => {
    if (!confirm('Delete all log entries? This cannot be undone.')) return;
    await clearLogs();
    load();
  };

  const tagOptions: Option[] = allTags.sort().map(t => ({ value: t, label: t }));
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="page">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-heading">Logs</h1>
          <p className="page-sub">{total.toLocaleString()} entries total</p>
        </div>
        <button onClick={handleClear} className="btn-danger text-xs px-3 py-1.5">
          Clear all
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 items-center flex-wrap">
        <input
          type="text"
          placeholder="Search messages…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="field-input w-64"
        />
        <div className="w-72">
          <Select<Option, true>
            isMulti
            options={tagOptions}
            value={tagOptions.filter(o => selectedTags.includes(o.value))}
            onChange={opts => setSelectedTags(opts.map(o => o.value))}
            placeholder="Filter by tags…"
            classNamePrefix="rs"
            styles={{
              control: base => ({ ...base, minHeight: 36, fontSize: 12, fontFamily: 'monospace', borderColor: '#e4e4e7', borderRadius: 2, boxShadow: 'none', '&:hover': { borderColor: '#a1a1aa' } }),
              menu: base => ({ ...base, fontSize: 12, fontFamily: 'monospace', borderRadius: 2, zIndex: 30 }),
              option: (base, s) => ({ ...base, backgroundColor: s.isFocused ? '#f4f4f5' : 'white', color: '#18181b' }),
              multiValue: base => ({ ...base, backgroundColor: '#f4f4f5', borderRadius: 2 }),
              multiValueLabel: base => ({ ...base, fontSize: 11 }),
            }}
          />
        </div>
        {(selectedTags.length > 0 || search) && (
          <button
            onClick={() => { setSelectedTags([]); setSearch(''); }}
            className="btn-ghost text-xs px-3 py-1.5"
          >
            Clear filters
          </button>
        )}
        <button onClick={load} className="btn-secondary text-xs px-3 py-1.5 ml-auto">
          ↺ Refresh
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Table */}
      {loading ? (
        <div className="text-sm text-zinc-400 py-8">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No log entries found.</p>
        </div>
      ) : (
        <>
          <div className="border border-zinc-200">
            <div className="grid grid-cols-[160px_1fr_200px_100px] gap-0 bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              <span>Time</span>
              <span>Message</span>
              <span>Tags</span>
              <span>Meta</span>
            </div>

            {entries.map(entry => (
              <div
                key={entry._id}
                className="grid grid-cols-[160px_1fr_200px_100px] gap-0 px-4 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 items-start"
              >
                <span className="text-[11px] text-zinc-400 whitespace-nowrap pt-0.5">
                  {entry.createdAt ? formatDateTime(entry.createdAt) : '—'}
                </span>
                <span className="text-sm text-zinc-800 pr-4">{entry.message}</span>
                <div className="flex flex-wrap gap-1 pr-4">
                  {entry.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                </div>
                <MetaCell meta={entry.meta} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-ghost px-3 py-1.5 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span>Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn-ghost px-3 py-1.5 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
