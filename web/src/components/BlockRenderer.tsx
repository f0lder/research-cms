import { useEffect, useState, CSSProperties, useCallback } from 'react';
import {
  Block,
  HeadingBlock,
  TextBlock,
  DividerBlock,
  SpacerBlock,
  ImageBlock,
  ButtonBlock,
  RowBlock,
  ColumnBlock,
  CardBlock,
  FieldBlock,
  ButtonAction,
  Spacing,
  ArchiveBlock,
} from '@research-cms/shared-types';
import { getMedia, getEntry, listEntries } from '@/lib/api';

type ArchiveItem = { _id: string; schemaSlug: string; data?: Record<string, unknown> };

function spacing(prefix: 'padding' | 'margin', s?: Spacing): CSSProperties {
  if (!s) return {};
  return {
    [`${prefix}Top`]: s.top,
    [`${prefix}Right`]: s.right,
    [`${prefix}Bottom`]: s.bottom,
    [`${prefix}Left`]: s.left,
  } as CSSProperties;
}

function baseStyle(block: Block): CSSProperties {
  return {
    ...spacing('padding', block.padding),
    ...spacing('margin', block.margin),
    ...(block.backgroundColor ? { backgroundColor: block.backgroundColor } : {}),
    ...(block.borderRadius != null ? { borderRadius: block.borderRadius } : {}),
  };
}

function handleAction(action: ButtonAction) {
  switch (action.type) {
    case 'navigate':
      window.location.hash = `#/${action.pageSlug}`;
      break;
    case 'url':
      window.open(action.url, '_blank', 'noopener');
      break;
    case 'schema':
      window.location.hash = `#/schema/${action.schemaSlug}`;
      break;
    case 'entry':
      window.location.hash = `#/${action.schemaSlug}/${action.entryId}`;
      break;
  }
}

function HeadingRenderer({ block }: { block: HeadingBlock }) {
  const Tag = (`h${block.level ?? 1}`) as 'h1' | 'h2' | 'h3' | 'h4';
  const style: CSSProperties = {
    ...baseStyle(block),
    textAlign: block.align,
    color: block.color, // explicit override
    fontWeight: block.fontWeight === 'semibold' ? 600 : block.fontWeight === 'bold' ? 700 : undefined,
  };
  return <Tag className={`cms-heading-${block.level ?? 1}`} style={style}>{block.text}</Tag>;
}

function TextRenderer({ block }: { block: TextBlock }) {
  const sizeMap: Record<string, string> = { sm: '14px', md: '16px', lg: '18px', xl: '20px' };
  const style: CSSProperties = {
    ...baseStyle(block),
    textAlign: block.align,
    color: block.color, // explicit override
    fontSize: block.fontSize ? sizeMap[block.fontSize] : undefined,
    lineHeight: 1.5,
    margin: 0,
  };
  return <p style={style}>{block.content}</p>;
}

function DividerRenderer({ block }: { block: DividerBlock }) {
  const style: CSSProperties = {
    ...baseStyle(block),
    borderTopWidth: block.thickness,
    borderTopStyle: (block.style ?? 'solid') as CSSProperties['borderTopStyle'],
    borderTopColor: block.color, // explicit override
  };
  return <hr className="cms-divider" style={style} />;
}

function SpacerRenderer({ block }: { block: SpacerBlock }) {
  return <div style={{ height: block.height, ...baseStyle(block) }} />;
}

function ImageRenderer({ block }: { block: ImageBlock }) {
  const [media, setMedia] = useState<{ url?: string; altText?: string; caption?: string; title?: string } | null>(
    block.media ?? null
  );
  const [loading, setLoading] = useState(!!block.mediaId && !block.media);

  useEffect(() => {
    if (!block.mediaId || block.media) return;
    let cancelled = false;
    getMedia(block.mediaId)
      .then(entry => {
        if (cancelled) return;
        const data = entry.data as Record<string, unknown>;
        setMedia({
          url: data?.url as string,
          altText: data?.altText as string,
          caption: data?.caption as string,
          title: data?.title as string,
        });
      })
      .catch(() => setMedia(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [block.mediaId, block.media]);

  if (loading) return <div style={{ ...baseStyle(block), height: 200, background: 'var(--color-border)' }} />;
  if (!media?.url) return <p className="cms-text-sub">— Image not available</p>;

  const img = (
    <img
      src={media.url}
      alt={block.alt ?? media.altText ?? media.title ?? ''}
      style={{
        ...baseStyle(block),
        width: block.width === 'full' ? '100%' : block.width,
        height: block.height,
        objectFit: block.fit ?? 'cover',
        display: 'block',
        borderRadius: block.borderRadius ?? 'var(--border-radius)',
      }}
    />
  );

  const wrapped = block.linkUrl ? (
    <a href={block.linkUrl} target="_blank" rel="noopener noreferrer">{img}</a>
  ) : img;

  return (
    <figure style={{ margin: 0 }}>
      {wrapped}
      {media.caption && <figcaption className="cms-text-sub" style={{ fontSize: 13, marginTop: 6 }}>{media.caption}</figcaption>}
    </figure>
  );
}

function ButtonRenderer({ block }: { block: ButtonBlock }) {
  const wrapperStyle: CSSProperties = {
    display: 'flex',
    justifyContent: block.align === 'center' ? 'center' : block.align === 'right' ? 'flex-end' : 'flex-start',
    ...spacing('margin', block.margin),
  };
  const buttonStyle: CSSProperties = {
    ...spacing('padding', block.padding),
    padding: block.padding ? undefined : '10px 16px', // fallback if no custom padding
    borderRadius: block.borderRadius, // overrides css var if set
    width: block.align === 'full' ? '100%' : undefined,
  };
  const variantClass = `cms-button-${block.variant ?? 'primary'}`;
  return (
    <div style={wrapperStyle}>
      <button type="button" className={`cms-button ${variantClass}`} style={buttonStyle} onClick={() => handleAction(block.action)}>
        {block.label}
      </button>
    </div>
  );
}

function RowRenderer({ block, entryData }: { block: RowBlock; entryData?: Record<string, unknown> }) {
  const justifyMap: Record<string, CSSProperties['justifyContent']> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'space-between',
  };
  const style: CSSProperties = {
    ...baseStyle(block),
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: block.gap ?? 8,
    justifyContent: justifyMap[block.align ?? 'start'],
  };
  return (
    <div style={style}>
      {block.columns.map((col, i) => (
        <div
          key={i}
          style={{
            flex: col.width === 'auto' ? undefined : 1,
            width: typeof col.width === 'number' ? col.width : undefined,
            minWidth: 0,
          }}
        >
          {col.blocks.map((b, j) => (
            <BlockRenderer key={j} block={b} entryData={entryData} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ColumnRenderer({ block, entryData }: { block: ColumnBlock; entryData?: Record<string, unknown> }) {
  const style: CSSProperties = {
    ...baseStyle(block),
    flex: block.width === 'auto' ? undefined : 1,
    width: typeof block.width === 'number' ? block.width : undefined,
    display: 'flex',
    flexDirection: 'column',
  };
  return (
    <div style={style}>
      {block.blocks.map((b, i) => (
        <BlockRenderer key={i} block={b} entryData={entryData} />
      ))}
    </div>
  );
}

function FieldRenderer({ block, entryData }: { block: FieldBlock; entryData?: Record<string, unknown> }) {
  const [resolved, setResolved] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  // Prefer pre-resolved block.value, else look it up in entryData
  const raw = (block.value !== undefined && block.value !== null)
    ? block.value
    : entryData?.[block.fieldName];

  useEffect(() => {
    if (!raw && raw !== 0) { setResolved(null); setLoading(false); return; }

    if (block.fieldType === 'media' && typeof raw === 'string' && raw) {
      setLoading(true);
      let cancelled = false;
      getMedia(raw)
        .then(entry => {
          if (cancelled) return;
          const d = entry.data as Record<string, unknown>;
          setResolved({ url: d?.url, altText: d?.altText, title: d?.title, caption: d?.caption });
        })
        .catch(() => !cancelled && setResolved(null))
        .finally(() => !cancelled && setLoading(false));
      return () => { cancelled = true; };
    }

    if (block.fieldType === 'reference' && typeof raw === 'string') {
      setLoading(true);
      let cancelled = false;
      const schemaSlug = (block as any).targetSlug || block.fieldName;
      getEntry(schemaSlug, raw)
        .then(entry => {
          if (cancelled) return;
          const d = entry.data as Record<string, unknown> | undefined;
          setResolved({ _id: entry._id, title: d?.title ?? d?.name, name: d?.name });
        })
        .catch(() => !cancelled && setResolved({ _id: raw }))
        .finally(() => !cancelled && setLoading(false));
      return () => { cancelled = true; };
    }

    if (block.fieldType === 'references' && Array.isArray(raw)) {
      setLoading(true);
      let cancelled = false;
      const schemaSlug = (block as any).targetSlug || block.fieldName;
      Promise.all(raw.map(async (id: string) => {
        try {
          const entry = await getEntry(schemaSlug, id);
          const d = entry.data as Record<string, unknown> | undefined;
          return { _id: entry._id, title: d?.title ?? d?.name, name: d?.name };
        } catch {
          return { _id: id };
        }
      })).then(resolved => {
        if (!cancelled) setResolved(resolved);
      }).finally(() => !cancelled && setLoading(false));
      return () => { cancelled = true; };
    }

    setResolved(raw);
    setLoading(false);
  }, [block.fieldType, block.fieldName, raw]);

  if (raw === null || raw === undefined || raw === '') return null;

  const wrapperStyle: CSSProperties = { ...baseStyle(block), marginBottom: 16 };
  const showLabel = block.showLabel !== false && block.labelPosition !== 'hidden';
  const inline = block.labelPosition === 'inline';

  const labelEl = showLabel && (
    <span className={`cms-field-label ${inline ? 'is-inline' : ''}`}>
      {block.label}
    </span>
  );

  return (
    <div style={wrapperStyle}>
      {labelEl}
      <FieldValue block={block} value={loading ? null : resolved} loading={loading} />
    </div>
  );
}

function FieldValue({ block, value, loading }: { block: FieldBlock; value: unknown; loading: boolean }) {
  if (loading) return <span className="cms-loading" style={{ fontSize: 13 }}>Loading…</span>;
  if (value === null || value === undefined || value === '') return null;

  switch (block.fieldType) {
    case 'richtext':
      return <div style={{ fontSize: 15, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: String(value) }} />;
    case 'email':
      return <a href={`mailto:${String(value)}`}>{String(value)}</a>;
    case 'url':
      return <a href={String(value)} target="_blank" rel="noopener noreferrer">{String(value)}</a>;
    case 'date':
    case 'datetime':
      return <span className="cms-text-sub cms-mono" style={{ fontSize: 14 }}>{new Date(String(value)).toLocaleString()}</span>;
    case 'boolean':
      return <span className={`cms-pill ${value ? 'cms-pill-yes' : 'cms-pill-no'}`}>{value ? 'Yes' : 'No'}</span>;
    case 'select':
      return <span className="cms-pill cms-pill-secondary">{String(value)}</span>;
    case 'tags': {
      const arr = Array.isArray(value) ? value : [];
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {arr.map((t, i) => (
            <span key={i} className="cms-pill cms-pill-accent">{String(t)}</span>
          ))}
        </div>
      );
    }
    case 'media': {
      const m = value as { url?: string; altText?: string; title?: string; caption?: string } | null;
      if (!m?.url) return <span className="cms-text-meta">— Image not available</span>;
      return (
        <figure style={{ margin: 0 }}>
          <img src={m.url} alt={m.altText ?? m.title ?? ''} style={{ maxWidth: '100%', height: 'auto', borderRadius: 'var(--border-radius)' }} />
          {m.caption && <figcaption className="cms-text-sub" style={{ fontSize: 13, marginTop: 6 }}>{m.caption}</figcaption>}
        </figure>
      );
    }
    case 'reference': {
      const ref = value as { _id?: string; title?: string; name?: string } | string;
      const refId = typeof ref === 'string' ? ref : ref._id;
      const refLabel = typeof ref === 'string' ? ref.slice(0, 8) : (ref.title ?? ref.name ?? ref._id?.slice(0, 8) ?? '');
      const slug = (block as any).targetSlug || block.fieldName;
      if (!refId) return null;
      return (
        <a href={`#/${slug}/${refId}`} style={{ color: 'var(--color-primary, #3B82F6)', textDecoration: 'underline', fontSize: 15 }}>
          {refLabel}
        </a>
      );
    }
    case 'references': {
      const arr = Array.isArray(value) ? value : [];
      const slug = (block as any).targetSlug || block.fieldName;
      if (arr.length === 0) return null;
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {arr.map((r, i) => {
            const ref = r as { _id?: string; title?: string; name?: string } | string;
            const refId = typeof ref === 'string' ? ref : ref._id;
            const label = typeof ref === 'string' ? ref.slice(0, 8) : (ref.title ?? ref.name ?? ref._id?.slice(0, 8) ?? '');
            if (!refId) return null;
            return (
              <a key={i} href={`#/${slug}/${refId}`} className="cms-pill cms-pill-outline" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                {label}
              </a>
            );
          })}
        </div>
      );
    }
    case 'textarea':
      return <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{String(value)}</p>;
    case 'number':
      return <span className="cms-mono" style={{ fontSize: 15 }}>{String(value)}</span>;
    default:
      return <span style={{ fontSize: 15 }}>{String(value)}</span>;
  }
}

function ArchiveRenderer({ block }: { block: ArchiveBlock }) {
  const [items, setItems] = useState<ArchiveItem[] | null>(block.items ?? null);
  const [loading, setLoading] = useState(!block.items);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const result = await listEntries(block.schemaSlug, 1, block.limit ?? 50);
      setItems(result.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [block.schemaSlug, block.limit]);

  useEffect(() => {
    if (block.items) return;
    load();
  }, [block.items, load]);

  const containerStyle: CSSProperties = { ...baseStyle(block), marginTop: 16, marginBottom: 16 };

  if (loading) {
    return (
      <div style={{ ...containerStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 100 }}>
        <span className="cms-loading">Loading…</span>
      </div>
    );
  }

  if (error || !items || items.length === 0) {
    return (
      <div style={containerStyle}>
        {block.title && <h3 className="cms-archive-title">{block.title}</h3>}
        <p className="cms-text-sub">{block.emptyMessage ?? 'No items found'}</p>
      </div>
    );
  }

  const renderItem = (item: ArchiveItem, key: number) => {
    const data = item.data ?? {};
    const title = (data.title as string) || (data.name as string) || item.schemaSlug;
    return (
      <a
        key={key}
        href={`#/${item.schemaSlug}/${item._id}`}
        className="cms-archive-card"
      >
        <div className="cms-archive-card-title">{title}</div>
        <div className="cms-archive-card-sub cms-text-sub">ID: {item._id.slice(0, 12)}</div>
      </a>
    );
  };

  if (block.layout === 'grid') {
    const cols = block.columns ?? 2;
    return (
      <div style={containerStyle}>
        {block.title && <h3 className="cms-archive-title">{block.title}</h3>}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap: 12,
          }}
        >
          {items.map((item, i) => renderItem(item, i))}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {block.title && <h3 className="cms-archive-title">{block.title}</h3>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => renderItem(item, i))}
      </div>
    </div>
  );
}

function CardRenderer({ block, entryData }: { block: CardBlock; entryData?: Record<string, unknown> }) {
  const elevationShadows: Record<number, string> = {
    0: 'none',
    1: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.10)',
    2: '0 2px 4px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.10)',
    3: '0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05)',
  };
  const style: CSSProperties = {
    ...baseStyle(block),
    background: block.backgroundColor, // overrides css var if set
    borderRadius: block.borderRadius,
    padding: block.padding ? undefined : 16,
    boxShadow: elevationShadows[block.elevation ?? 1] ?? elevationShadows[1],
  };
  const onClick = block.pressAction ? () => block.pressAction && handleAction(block.pressAction) : undefined;
  return (
    <div style={style} className={`cms-card ${block.pressAction ? 'is-clickable' : ''}`} onClick={onClick}>
      {block.blocks.map((b, i) => (
        <BlockRenderer key={i} block={b} entryData={entryData} />
      ))}
    </div>
  );
}

export function BlockRenderer({ block, entryData }: { block: Block; entryData?: Record<string, unknown> }) {
  if (block.visible === false) return null;

  switch (block.type) {
    case 'heading': return <HeadingRenderer block={block} />;
    case 'text': return <TextRenderer block={block} />;
    case 'divider': return <DividerRenderer block={block} />;
    case 'spacer': return <SpacerRenderer block={block} />;
    case 'image': return <ImageRenderer block={block} />;
    case 'button': return <ButtonRenderer block={block} />;
    case 'row': return <RowRenderer block={block} entryData={entryData} />;
    case 'column': return <ColumnRenderer block={block} entryData={entryData} />;
    case 'card': return <CardRenderer block={block} entryData={entryData} />;
    case 'field': return <FieldRenderer block={block} entryData={entryData} />;
    case 'archive': return <ArchiveRenderer block={block} />;
    default: return null;
  }
}
