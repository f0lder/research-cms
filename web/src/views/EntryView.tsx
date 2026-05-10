import { useEffect, useState } from 'react';
import { Block } from '@research-cms/shared-types';
import { getRenderedLayout } from '@/lib/api';
import { BlockRenderer } from '@/components/BlockRenderer';
import { useTheme } from '@/lib/theme';

export function EntryView({ slug, id }: { slug: string; id: string }) {
  const colors = useTheme();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getRenderedLayout(slug, id)
      .then(res => {
        setBlocks(res.blocks);
        setData(res.data);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug, id]);

  if (loading) return <p style={{ color: colors.subText }}>Loading…</p>;
  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>;
  if (!data) return <p style={{ color: colors.subText }}>Not found.</p>;

  if (blocks.length === 0) return <FieldsFallback data={data} />;

  return (
    <article>
      {blocks.map((b, i) => (
        <BlockRenderer key={i} block={b} entryData={data} />
      ))}
    </article>
  );
}

function FieldsFallback({ data }: { data: Record<string, unknown> }) {
  const colors = useTheme();
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (entries.length === 0) return <p style={{ color: colors.metaText }}>This entry has no data.</p>;
  return (
    <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <dt style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: colors.subText, fontFamily: 'monospace' }}>
            {humanize(k)}
          </dt>
          <dd style={{ margin: 0, fontSize: 15, color: colors.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {stringify(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, c => c.toUpperCase());
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.every(v => typeof v === 'string' || typeof v === 'number')) return value.join(', ');
    return JSON.stringify(value, null, 2);
  }
  return JSON.stringify(value, null, 2);
}
