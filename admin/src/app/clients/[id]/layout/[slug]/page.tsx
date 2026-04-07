'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockDefinition, Client } from '@research-cms/shared-types';
import {
  getClient,
  getSchema,
  getLayout,
  upsertClientLayout,
  extractParam,
  adminRoutes,
} from '@/lib/utils';

// ── Sortable block row ────────────────────────────────────────────────────────
function SortableBlock({
  block,
  onToggle,
}: {
  block: BlockDefinition;
  onToggle: (fieldName: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.fieldName });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 bg-white border border-zinc-200 mb-2 ${
        isDragging ? 'shadow-md' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing text-lg leading-none select-none px-1"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>

      <input
        type="checkbox"
        checked={block.visible}
        onChange={() => onToggle(block.fieldName)}
        className="cursor-pointer"
        title={block.visible ? 'Hide block' : 'Show block'}
      />

      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${block.visible ? 'text-zinc-800' : 'text-zinc-400'}`}>
          {block.label}
        </span>
        <span className="ml-2 text-[10px] text-zinc-400 font-mono">{block.fieldName}</span>
      </div>

      <span className="text-[10px] text-zinc-300 font-mono uppercase tracking-wider">
        {block.type}
      </span>
    </div>
  );
}

// ── Merge helpers ─────────────────────────────────────────────────────────────

/**
 * Overlays client-specific visible/order preferences onto the global layout.
 * Global layout is authoritative for field existence (already synced with schema).
 */
function mergeLayouts(
  globalBlocks: BlockDefinition[],
  clientBlocks: BlockDefinition[],
): BlockDefinition[] {
  const clientMap = new Map(clientBlocks.map(b => [b.fieldName, b]));
  return globalBlocks
    .map(b => {
      const clientBlock = clientMap.get(b.fieldName);
      return clientBlock
        ? { ...b, visible: clientBlock.visible, order: clientBlock.order }
        : b;
    })
    .sort((a, b) => a.order - b.order);
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ClientLayoutEditorPage() {
  const params = useParams();
  const id = extractParam(params, 'id');
  const slug = extractParam(params, 'slug');

  const [blocks, setBlocks] = useState<BlockDefinition[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [schemaName, setSchemaName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const sensors = useSensors(useSensor(PointerSensor));

  const load = useCallback(async () => {
    setLoading(true);
    const [clientRes, schemaRes, globalLayoutRes] = await Promise.all([
      getClient(id),
      getSchema(slug),
      getLayout(slug),
    ]);

    if (clientRes.error || schemaRes.error) {
      setError(clientRes.error ?? schemaRes.error ?? 'Failed to load');
      setLoading(false);
      return;
    }

    const clientDoc = clientRes.data!;
    setClient(clientDoc);
    setSchemaName(schemaRes.data!.name);

    // Global layout is the authoritative base (synced with schema by the API)
    const globalBlocks = globalLayoutRes.data?.blocks ?? [];

    // If client has a saved layout for this schema, overlay its preferences
    const clientSavedLayout = clientDoc.layouts.find(l => l.schemaSlug === slug);
    const merged = clientSavedLayout
      ? mergeLayouts(globalBlocks, clientSavedLayout.blocks)
      : globalBlocks;

    setBlocks(merged);
    setLoading(false);
  }, [id, slug]);

  useEffect(() => { if (id && slug) load(); }, [id, slug, load]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBlocks(prev => {
      const oldIndex = prev.findIndex(b => b.fieldName === active.id);
      const newIndex = prev.findIndex(b => b.fieldName === over.id);
      return arrayMove(prev, oldIndex, newIndex).map((b, i) => ({ ...b, order: i }));
    });
  };

  const toggleVisibility = (fieldName: string) => {
    setBlocks(prev =>
      prev.map(b => b.fieldName === fieldName ? { ...b, visible: !b.visible } : b)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const { error: err } = await upsertClientLayout(id, slug, blocks);
    setSaving(false);
    if (err) { setError(err); return; }
    setSaved(true);
    // Update local client state to reflect new custom layout
    setClient(prev => {
      if (!prev) return prev;
      const existing = prev.layouts.findIndex(l => l.schemaSlug === slug);
      const updated = existing >= 0
        ? prev.layouts.map((l, i) => i === existing ? { ...l, blocks } : l)
        : [...prev.layouts, { schemaSlug: slug, blocks }];
      return { ...prev, layouts: updated };
    });
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="p-8 font-mono text-sm text-zinc-400">Loading…</div>;
  if (error) return <div className="p-8"><div className="alert-error">{error}</div></div>;

  const visibleCount = blocks.filter(b => b.visible).length;
  const hasCustom = client?.layouts.some(l => l.schemaSlug === slug) ?? false;

  return (
    <div className="p-8 font-mono max-w-2xl">
      {/* Breadcrumb */}
      <p className="breadcrumb mb-6">
        <Link href={adminRoutes.clients}>Clients</Link>
        <span className="mx-1">/</span>
        <Link href={adminRoutes.clientDetail(id)}>{client?.name ?? id}</Link>
        <span className="mx-1">/</span>
        {schemaName}
        <span className="mx-1">/</span>
        Layout
      </p>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-heading">Block Layout</h1>
          <p className="page-sub">
            {visibleCount} of {blocks.length} block{blocks.length !== 1 ? 's' : ''} visible · drag to reorder
          </p>
          {!hasCustom && (
            <p className="text-[11px] text-zinc-400 mt-1">
              Currently using global default — saving will create a custom layout for this client.
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`btn-primary ${saved ? 'opacity-75' : ''}`}
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save layout'}
        </button>
      </div>

      {blocks.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No fields in this schema yet.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-3 text-[11px] text-zinc-400 px-1">
            <span>☰ drag to reorder</span>
            <span>□ toggle visibility</span>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b.fieldName)} strategy={verticalListSortingStrategy}>
              {blocks.map(block => (
                <SortableBlock key={block.fieldName} block={block} onToggle={toggleVisibility} />
              ))}
            </SortableContext>
          </DndContext>

          <div className="mt-6 p-4 border border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
            <p className="font-semibold text-zinc-600 mb-1">Effect</p>
            <p>
              When this client's key is used, <code className="font-mono">GET /public/{slug}</code> will
              return only the blocks configured above in the order defined here.
              Other clients and the global layout are unaffected.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
