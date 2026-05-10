import { useEffect, useState, useCallback } from 'react';
import { PublicEntryResponse } from '@research-cms/shared-types';
import { listEntries } from '@/lib/api';
import { entryTitle, entrySubtitle } from '@/lib/helpers';
import { useTheme } from '@/lib/theme';

const PAGE_SIZE = 20;

export function ArchiveView({ slug, schemaName }: { slug: string; schemaName: string }) {
  const colors = useTheme();
  const [entries, setEntries] = useState<PublicEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setEntries([]);
    setPage(1);
    setHasMore(false);
    setError('');
    setLoading(true);

    listEntries(slug, 1, PAGE_SIZE)
      .then(res => {
        setEntries(res.items);
        setHasMore(res.items.length < res.total);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setLoadingMore(true);
    listEntries(slug, next, PAGE_SIZE)
      .then(res => {
        setEntries(prev => [...prev, ...res.items]);
        setPage(next);
        setHasMore((next - 1) * PAGE_SIZE + res.items.length < res.total);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingMore(false));
  }, [slug, page, hasMore, loadingMore]);

  if (loading) return <p style={{ color: colors.subText }}>Loading…</p>;
  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>;
  if (entries.length === 0) return <p style={{ color: colors.subText }}>No published entries yet.</p>;

  return (
    <section>
      <h1 style={{ marginTop: 0, marginBottom: 16, color: colors.primary }}>{schemaName}</h1>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {entries.map(item => {
          const sub = entrySubtitle(item);
          return (
            <li key={item._id} style={{ marginBottom: 12 }}>
              <a
                href={`#/${slug}/${item._id}`}
                style={{
                  display: 'block',
                  background: colors.cardBg,
                  borderRadius: colors.borderRadius,
                  padding: 16,
                  textDecoration: 'none',
                  color: 'inherit',
                  borderLeft: `4px solid ${colors.secondary}`,
                  borderTop: `${colors.borderWidth}px solid ${colors.border}`,
                  borderRight: `${colors.borderWidth}px solid ${colors.border}`,
                  borderBottom: `${colors.borderWidth}px solid ${colors.border}`,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{entryTitle(item)}</div>
                {sub && <div style={{ fontSize: 13, color: colors.subText, lineHeight: 1.4 }}>{sub}</div>}
                {item.createdAt && (
                  <div style={{ fontSize: 11, color: colors.accent, fontFamily: 'monospace', marginTop: 6, fontWeight: 600 }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                )}
              </a>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.primary,
              fontSize: 13,
              fontFamily: 'monospace',
              cursor: loadingMore ? 'wait' : 'pointer',
            }}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </section>
  );
}
