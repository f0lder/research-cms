'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Select from 'react-select';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block, PageStatus, ContentTypeDefinition, ClientPage } from '@research-cms/shared-types';
import { generateSlugFromName, extractParam, adminRoutes } from '@/lib/utils';
import { getClientPage, createClientPage, updateClientPage, getAllSchemas, listClientPages } from '@/app/actions';

type Option = { value: string; label: string };
type AdminBlock = Block & ({ type: 'heading' } | { type: 'text' } | { type: 'archive' });
const IS_NEW = '_new';

// ── Block editors ─────────────────────────────────────────────────────────────

function HeadingEditor({ block, onChange }: { block: AdminBlock & { type: 'heading' }; onChange: (b: AdminBlock) => void }) {
  return (
    <div className="flex gap-2 flex-1">
      <select
        value={block.level ?? 2}
        onChange={e => onChange({ ...block, level: Number(e.target.value) as 1 | 2 | 3 })}
        className="field-input w-16 text-xs"
      >
        <option value={1}>H1</option>
        <option value={2}>H2</option>
        <option value={3}>H3</option>
      </select>
      <input
        className="field-input flex-1 text-sm"
        placeholder="Heading text…"
        value={block.text}
        onChange={e => onChange({ ...block, text: e.target.value })}
      />
    </div>
  );
}

function TextEditor({ block, onChange }: { block: AdminBlock & { type: 'text' }; onChange: (b: AdminBlock) => void }) {
  return (
    <textarea
      className="field-input w-full text-sm resize-y"
      rows={4}
      placeholder="Paragraph text…"
      value={block.content}
      onChange={e => onChange({ ...block, content: e.target.value })}
    />
  );
}

function ArchiveEditor({
  block, onChange, schemas,
}: { block: AdminBlock & { type: 'archive' }; onChange: (b: AdminBlock) => void; schemas: ContentTypeDefinition[] }) {
  const options: Option[] = schemas.map(s => ({ value: s.slug, label: s.name }));
  return (
    <div className="flex gap-2 flex-wrap flex-1 items-start">
      <div className="w-40">
        <Select<Option>
          options={options}
          value={options.find(o => o.value === block.schemaSlug) ?? null}
          onChange={opt => onChange({ ...block, schemaSlug: opt?.value ?? '' })}
          placeholder="Schema…"
          classNamePrefix="rs"
          styles={{
            control: base => ({ ...base, minHeight: 32, fontSize: 12, fontFamily: 'monospace', borderColor: '#e4e4e7', borderRadius: 2, boxShadow: 'none' }),
            menu: base => ({ ...base, fontSize: 12, fontFamily: 'monospace', borderRadius: 2, zIndex: 30 }),
            option: (base, s) => ({ ...base, backgroundColor: s.isFocused ? '#f4f4f5' : 'white', color: '#18181b' }),
          }}
        />
      </div>
      <input
        className="field-input flex-1 text-sm"
        placeholder="Section title (optional)"
        value={block.title ?? ''}
        onChange={e => onChange({ ...block, title: e.target.value || undefined })}
      />
      <div className="flex items-center gap-1">
        <label className="text-[11px] text-zinc-400 font-mono">limit</label>
        <input
          type="number"
          className="field-input w-16 text-sm"
          min={1} max={50}
          value={block.limit ?? 5}
          onChange={e => onChange({ ...block, limit: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}

// ── Sortable block row ────────────────────────────────────────────────────────

function SortableBlock({
  block, index, schemas, onChange, onRemove,
}: {
  block: AdminBlock;
  index: number;
  schemas: ContentTypeDefinition[];
  onChange: (b: AdminBlock) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: index });

  const typeLabel = { heading: 'Heading', text: 'Text', archive: 'Archive' }[block.type];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="border border-zinc-200 bg-white mb-3"
    >
      {/* Block header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border-b border-zinc-100">
        <button {...attributes} {...listeners}
          className="text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing text-base leading-none select-none"
          aria-label="Drag to reorder"
        >⠿</button>
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{typeLabel}</span>
        <button onClick={onRemove}
          className="ml-auto text-[10px] text-red-400 hover:text-red-600 font-mono border border-red-200 px-2 py-0.5 hover:border-red-400 transition-colors"
        >
          Remove
        </button>
      </div>

      {/* Block body */}
      <div className="p-3">
        {block.type === 'heading' && (
          <HeadingEditor block={block} onChange={onChange} />
        )}
        {block.type === 'text' && (
          <TextEditor block={block} onChange={onChange} />
        )}
        {block.type === 'archive' && (
          <ArchiveEditor block={block} onChange={onChange} schemas={schemas} />
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PageEditorPage() {
  const params = useParams();
  const clientId = extractParam(params, 'id');
  const pageId = extractParam(params, 'pageId');
  const isNew = pageId === IS_NEW;
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [status, setStatus] = useState<PageStatus>('draft');
  const [parentId, setParentId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<AdminBlock[]>([]);
  const [schemas, setSchemas] = useState<ContentTypeDefinition[]>([]);
  const [otherPages, setOtherPages] = useState<ClientPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const sensors = useSensors(useSensor(PointerSensor));

  const load = useCallback(async () => {
    const [schemasRes, pageRes, pagesRes] = await Promise.all([
      getAllSchemas(),
      isNew ? Promise.resolve({ data: null, error: null }) : getClientPage(clientId, pageId),
      listClientPages(clientId),
    ]);
    
    if (schemasRes.error) { setError(schemasRes.error); setLoading(false); return; }
    if (pagesRes.error) { setError(pagesRes.error); setLoading(false); return; }
    if (!isNew && pageRes.error) { setError(pageRes.error); setLoading(false); return; }
    
    setSchemas(schemasRes.data ?? []);
    // Other pages available as parents (exclude self)
    setOtherPages((pagesRes.data ?? []).filter(p => p._id !== pageId));

    if (!isNew && pageRes.data) {
      const p = pageRes.data as ClientPage;
      setTitle(p.title);
      setSlug(p.slug);
      setSlugTouched(true);
      setStatus(p.status);
      setParentId(p.parentId ?? null);
      // Filter out field blocks since admin only supports static blocks
      setBlocks((p.blocks ?? []).filter((b): b is AdminBlock => b.type !== 'field'));
    }
    setLoading(false);
  }, [clientId, pageId, isNew]);

  useEffect(() => { load(); }, [load]);

  // Auto-generate slug from title on new pages
  useEffect(() => {
    if (isNew && !slugTouched && title) {
      setSlug(generateSlugFromName(title));
    }
  }, [title, isNew, slugTouched]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBlocks(prev => arrayMove(prev, Number(active.id), Number(over.id)));
  };

  const updateBlock = (index: number, updated: AdminBlock) => {
    setBlocks(prev => prev.map((b, i) => i === index ? updated : b));
  };

  const removeBlock = (index: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== index));
  };

  const addBlock = (type: AdminBlock['type']) => {
    const defaults: Record<AdminBlock['type'], AdminBlock> = {
      heading: { type: 'heading', text: '', level: 2 },
      text:    { type: 'text', content: '' },
      archive: { type: 'archive', schemaSlug: schemas[0]?.slug ?? '', limit: 5 },
    };
    setBlocks(prev => [...prev, defaults[type]]);
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) { setError('Title and slug are required.'); return; }
    setSaving(true);
    setSaved(false);
    setError('');

    const payload = { title: title.trim(), slug: slug.trim(), status, parentId, blocks };

    if (isNew) {
      const { data, error: err } = await createClientPage(clientId, payload);
      setSaving(false);
      if (err) { setError(err); return; }
      // Navigate to the edit URL so we don't re-create on save
      if (data && data._id) {
        router.replace(adminRoutes.clientPageEdit(clientId, data._id));
      } else {
        setError('Failed to create page: missing ID');
      }
    } else {
      const { error: err } = await updateClientPage(clientId, pageId, payload);
      setSaving(false);
      if (err) { setError(err); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (loading) return <div className="p-8 font-mono text-sm text-zinc-400">Loading…</div>;

  if (error) {
    return (
      <div className="p-8">
        <div className="alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 font-mono max-w-3xl">
      {/* Breadcrumb */}
      <p className="breadcrumb mb-6">
        <Link href={adminRoutes.clients}>Clients</Link>
        <span className="mx-1">/</span>
        <Link href={adminRoutes.clientDetail(clientId)}>Client</Link>
        <span className="mx-1">/</span>
        {isNew ? 'New page' : title || 'Edit page'}
      </p>

      {error && <div className="alert-error mb-4">{error}</div>}

      {/* ── Meta ──────────────────────────────────────── */}
      <div className="border border-zinc-200 p-4 mb-6">
        <div className="flex gap-4 mb-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Title</label>
            <input
              className="field-input w-full"
              placeholder="Page title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-36">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Slug</label>
            <input
              className="field-input w-full font-mono"
              placeholder="page-slug"
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugTouched(true); }}
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Parent</label>
            <select
              className="field-input font-mono"
              value={parentId ?? ''}
              onChange={e => setParentId(e.target.value || null)}
            >
              <option value="">— None (top level) —</option>
              {otherPages.map(p => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Status</label>
            <select
              className="field-input font-mono"
              value={status}
              onChange={e => setStatus(e.target.value as PageStatus)}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
        </div>
        <p className="text-[11px] text-zinc-400">
          Public endpoint: <code className="font-mono">GET /public/pages/{slug || '…'}</code>
        </p>
      </div>

      {/* ── Blocks ────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
          Blocks <span className="normal-case">({blocks.length})</span>
        </p>
        <div className="flex gap-2">
          {(['heading', 'text', 'archive'] as AdminBlock['type'][]).map(t => (
            <button key={t} onClick={() => addBlock(t)}
              className="text-[11px] border border-zinc-200 px-2 py-1 text-zinc-500 hover:text-zinc-800 hover:border-zinc-400 transition-colors font-mono bg-white"
            >
              + {t}
            </button>
          ))}
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-200 p-10 text-center mb-6">
          <p className="text-zinc-400 text-sm">No blocks yet. Add one above.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((_, i) => i)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, i) => (
              <SortableBlock
                key={i}
                block={block}
                index={i}
                schemas={schemas}
                onChange={b => updateBlock(i, b)}
                onRemove={() => removeBlock(i)}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* ── Save ─────────────────────────────────────── */}
      <div className="flex justify-end pt-2">
        <button onClick={handleSave} disabled={saving} className={`btn-primary ${saved ? 'opacity-75' : ''}`}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : isNew ? 'Create page' : 'Save page'}
        </button>
      </div>
    </div>
  );
}
