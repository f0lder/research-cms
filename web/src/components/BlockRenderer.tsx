import { useEffect, useState, CSSProperties } from 'react';
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
} from '@research-cms/shared-types';
import { getMedia } from '@/lib/api';

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
    setResolved(raw);
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
      if (typeof ref === 'string') return <span className="cms-text-sub cms-mono" style={{ fontSize: 13 }}>{ref.slice(0, 8)}</span>;
      return <span>{ref.title ?? ref.name ?? ref._id?.slice(0, 8)}</span>;
    }
    case 'references': {
      const arr = Array.isArray(value) ? value : [];
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {arr.map((r, i) => {
            const ref = r as { _id?: string; title?: string; name?: string } | string;
            const label = typeof ref === 'string' ? ref.slice(0, 8) : (ref.title ?? ref.name ?? ref._id?.slice(0, 8) ?? '');
            return <span key={i} className="cms-pill cms-pill-outline">{label}</span>;
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
    default: return null;
  }
}
