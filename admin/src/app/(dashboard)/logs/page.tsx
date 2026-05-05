'use client';
import { Fragment, useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { LogEntry } from '@research-cms/shared-types';
import { formatDateTime } from '@/lib/utils';
import { getLogs, getLogTags, clearLogs } from '@/app/actions';
import { ActivityFeed } from '@/components/ActivityFeed';
import { Button, TextField, Heading, Text, Badge } from '@/components/ui';
import { ListSkeleton } from '@/components/skeletons';
import { useToast } from '@/contexts/ToastContext';


const PAGE_SIZE = 50;

type Option = { value: string; label: string };

export default function LogsPage() {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [expandedMeta, setExpandedMeta] = useState<Set<string>>(new Set());

  const toggleMeta = (id: string) => {
    setExpandedMeta(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
    const result = await clearLogs();
    if (result.error) {
      showToast(result.error, 'error');
    } else {
      showToast('All logs cleared successfully', 'success');
      load();
    }
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
          <div className="border-2 border-on-surface overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-container border-b-2 border-on-surface text-code font-bold text-on-surface-variant uppercase">
                  <th className="text-left px-4 py-2.5 w-40">Time</th>
                  <th className="text-left px-4 py-2.5">Message</th>
                  <th className="text-left px-4 py-2.5 w-52">Tags</th>
                  <th className="text-left px-4 py-2.5 w-24">Meta</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => {
                  const id = entry._id ?? '';
                  const hasMeta = !!entry.meta && Object.keys(entry.meta).length > 0;
                  const isExpanded = expandedMeta.has(id);
                  return (
                    <Fragment key={id}>
                      <tr className="border-b border-on-surface hover:bg-surface-container align-top">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Text variant="code" color="secondary">
                            {entry.createdAt ? formatDateTime(entry.createdAt) : '—'}
                          </Text>
                        </td>
                        <td className="px-4 py-3">
                          <Text variant="body-md">{entry.message}</Text>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.map(tag => (
                              <Badge key={tag} status={tag || 'default'} />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {hasMeta ? (
                            <Button
                              onClick={() => toggleMeta(id)}
                              variant="ghost"
                              size="sm"
                              className="text-code"
                            >
                              {isExpanded ? 'hide' : 'show'}
                            </Button>
                          ) : (
                            <Text variant="caption" color="secondary">—</Text>
                          )}
                        </td>
                      </tr>
                      {isExpanded && hasMeta && (
                        <tr className="border-b-2 border-on-surface bg-surface-container">
                          <td colSpan={4} className="p-0">
                            <pre className="text-code text-on-surface-variant p-4 whitespace-pre-wrap break-all">
                              {JSON.stringify(entry.meta, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
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
