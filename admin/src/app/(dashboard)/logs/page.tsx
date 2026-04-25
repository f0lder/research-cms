'use client';
import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { LogEntry } from '@research-cms/shared-types';
import { formatDateTime } from '@/lib/utils';
import { getLogs, getLogTags, clearLogs } from '@/app/actions';
import { ActivityFeed } from '@/components/ActivityFeed';
import { Button, TextField, Heading, Text, Badge } from '@/components/ui';
import { ListSkeleton } from '@/components/skeletons';


// ── Meta viewer ───────────────────────────────────────────────────────────────
function MetaCell({ meta }: { meta?: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false);
  if (!meta || Object.keys(meta).length === 0) return <Text variant="caption" color="secondary">—</Text>;
  return (
    <div>
      <Button
        onClick={() => setOpen(o => !o)}
        variant="ghost"
        size="sm"
        className="text-code"
      >
        {open ? 'hide' : 'meta'}
      </Button>
      {open && (
        <pre className="mt-1 text-code text-on-surface-variant bg-surface-container border-2 border-on-surface p-2 whitespace-pre-wrap max-w-xs">
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
          <Heading level={1} className="mb-1">Logs</Heading>
          <Text variant="caption" color="secondary">{total.toLocaleString()} entries total</Text>
        </div>
        <Button onClick={handleClear} variant="secondary" size="sm">
          Clear all
        </Button>
      </div>

      {/* Activity Feed */}
      <div className="mb-8 border-2 border-on-surface p-6 bg-surface">
        <Heading level={2} className="mb-4">Recent Activity</Heading>
        <ActivityFeed />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 items-center flex-wrap">
        <TextField
          placeholder="Search messages…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
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
          <Button
            onClick={() => { setSelectedTags([]); setSearch(''); }}
            variant="ghost"
            size="sm"
          >
            Clear filters
          </Button>
        )}
        <Button onClick={load} variant="secondary" size="sm" className="ml-auto">
          ↺ Refresh
        </Button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Table */}
      {loading ? (
          <ListSkeleton items={10} />
      ) : entries.length === 0 ? (
        <div className="border-2 border-dashed border-on-surface p-12 text-center">
          <Text variant="caption" color="secondary">No log entries found.</Text>
        </div>
      ) : (
        <>
          <div className="border-2 border-on-surface">
            <div className="grid grid-cols-[160px_1fr_200px_100px] gap-0 bg-surface-container border-b-2 border-on-surface px-4 py-2.5 text-code font-bold text-on-surface-variant uppercase">
              <span>Time</span>
              <span>Message</span>
              <span>Tags</span>
              <span>Meta</span>
            </div>

            {entries.map(entry => (
              <div
                key={entry._id}
                className="grid grid-cols-[160px_1fr_200px_100px] gap-0 px-4 py-3 border-b border-on-surface last:border-0 hover:bg-surface-container items-start"
              >
                <Text variant="code" color="secondary" className="whitespace-nowrap pt-0.5">
                  {entry.createdAt ? formatDateTime(entry.createdAt) : '—'}
                </Text>
                <Text variant="body-md" className="pr-4">{entry.message}</Text>
                <div className="flex flex-wrap gap-1 pr-4">
                  {entry.tags.map(tag => (
                    <Badge key={tag} status={tag || 'default'}/>
                  ))}
                </div>
                <MetaCell meta={entry.meta} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 mt-4">
              <Button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                variant="ghost"
                size="sm"
              >
                ← Prev
              </Button>
              <Text variant="caption" color="secondary">Page {page + 1} of {totalPages}</Text>
              <Button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                variant="ghost"
                size="sm"
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
