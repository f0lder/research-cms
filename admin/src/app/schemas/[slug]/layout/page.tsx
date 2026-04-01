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
import { BlockDefinition } from '@research-cms/shared-types';
import { getSchema, getLayout, saveLayout, extractParam, adminRoutes } from '@/lib/utils';

// ── Sortable block row ─────────────────────────────────────────────────────────
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
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing text-lg leading-none select-none px-1"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>

      {/* Visibility toggle */}
      <input
        type="checkbox"
        checked={block.visible}
        onChange={() => onToggle(block.fieldName)}
        className="cursor-pointer"
        title={block.visible ? 'Hide block' : 'Show block'}
      />

      {/* Block info */}
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

// ── Page ───────────────────────────────────────────────────────────────────────
export default function LayoutEditorPage() {
  const params = useParams();
  const slug = extractParam(params, 'slug');

  const [blocks, setBlocks] = useState<BlockDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [schemaName, setSchemaName] = useState('');

  const sensors = useSensors(useSensor(PointerSensor));

  const load = useCallback(async () => {
    setLoading(true);
    const [schemaRes, layoutRes] = await Promise.all([getSchema(slug), getLayout(slug)]);
    if (schemaRes.error) { setError(schemaRes.error); setLoading(false); return; }

    const schema = schemaRes.data!;
    setSchemaName(schema.name);

    // API always returns synced blocks (merged against live schema)
    setBlocks(layoutRes.data?.blocks ?? []);
    setLoading(false);
  }, [slug]);

  useEffect(() => { if (slug) load(); }, [slug, load]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBlocks(prev => {
      const oldIndex = prev.findIndex(b => b.fieldName === active.id);
      const newIndex = prev.findIndex(b => b.fieldName === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      return reordered.map((b, i) => ({ ...b, order: i }));
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
    const { error: err } = await saveLayout(slug, blocks);
    setSaving(false);
    if (err) { setError(err); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="p-8 font-mono text-sm text-zinc-400">Loading…</div>;
  if (error) return <div className="p-8"><div className="alert-error">{error}</div></div>;

  const visibleCount = blocks.filter(b => b.visible).length;

  return (
    <div className="p-8 font-mono max-w-2xl">
      {/* Breadcrumb */}
      <p className="breadcrumb">
        <Link href="/schemas">Content Types</Link>
        <span className="mx-1">/</span>
        <Link href={adminRoutes.schemaDetail(slug)}>{schemaName}</Link>
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
          {/* Legend */}
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

          {/* Public API info box */}
          <div className="mt-6 p-4 border border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
            <p className="font-semibold text-zinc-600 mb-1">Public API endpoint</p>
            <code className="text-[11px] font-mono break-all">
              GET /public/{slug}
            </code>
            <p className="mt-2">
              Requires <code className="font-mono">X-API-Key: &lt;your-key&gt;</code> header.
              Only visible blocks are returned, in the order defined above.
              Entries with <code className="font-mono">status: draft</code> are excluded.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
