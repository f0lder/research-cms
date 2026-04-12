'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Select from 'react-select';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block, ContentTypeDefinition, FieldDefinition, BuiltInFieldType } from '@research-cms/shared-types';
import { extractParam, adminRoutes } from '@/lib/utils';
import { getSchema, getAllSchemas, getLayout, upsertLayout } from '@/app/actions';

type Option = { value: string; label: string };
type AdminBlock = Block & ({ type: 'heading' } | { type: 'text' } | { type: 'archive' } | { type: 'field' });

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

function FieldBlockEditor({
  block, onChange, schemaFields,
}: {
  block: AdminBlock & { type: 'field' };
  onChange: (b: AdminBlock) => void;
  schemaFields: FieldDefinition[];
}) {
  const typeLabelMap = {
    'text': 'Text',
    'textarea': 'Textarea',
    'email': 'Email',
    'url': 'URL',
    'number': 'Number',
    'date': 'Date',
    'datetime': 'DateTime',
    'boolean': 'Boolean',
    'media': 'Media',
    'select': 'Select',
    'tags': 'Tags',
    'reference': 'Reference',
    'references': 'References',
  } as const satisfies Record<BuiltInFieldType, string>;

  const typeLabel = (typeLabelMap as Record<string, string>)[block.fieldType] || String(block.fieldType);

  const fieldOptions: Option[] = schemaFields.map(f => ({ value: f.name, label: f.label }));

  return (
    <div className="flex gap-2 flex-1 items-center">
      <div className="flex-1 max-w-xs">
        <Select<Option>
          options={fieldOptions}
          value={fieldOptions.find(o => o.value === block.fieldName) ?? null}
          onChange={opt => {
            const field = schemaFields.find(f => f.name === opt?.value);
            if (field) {
              onChange({
                ...block,
                fieldName: field.name,
                label: field.label,
                fieldType: field.type,
              });
            }
          }}
          placeholder="Select field…"
          classNamePrefix="rs"
          styles={{
            control: base => ({ ...base, minHeight: 32, fontSize: 12, fontFamily: 'monospace', borderColor: '#e4e4e7', borderRadius: 2, boxShadow: 'none' }),
            menu: base => ({ ...base, fontSize: 12, fontFamily: 'monospace', borderRadius: 2, zIndex: 30 }),
            option: (base, s) => ({ ...base, backgroundColor: s.isFocused ? '#f4f4f5' : 'white', color: '#18181b' }),
          }}
        />
      </div>
      {block.fieldName && (
        <>
          <span className="text-zinc-600 text-sm">{block.label}</span>
          <span className="ml-auto text-[10px] text-zinc-400 font-mono uppercase tracking-wider">{typeLabel}</span>
        </>
      )}
    </div>
  );
}

// ── Sortable block row ────────────────────────────────────────────────────────

function SortableBlock({
  block, index, schemas, schemaFields, onChange, onRemove,
}: {
  block: AdminBlock;
  index: number;
  schemas: ContentTypeDefinition[];
  schemaFields: FieldDefinition[];
  onChange: (b: AdminBlock) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: index });

  const typeLabel = block.type === 'field' ? 'Field' : 
                    block.type === 'heading' ? 'Heading' :
                    block.type === 'text' ? 'Text' : 'Archive';

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={`border mb-3 ${block.type === 'field' ? 'border-blue-200 bg-blue-50' : 'border-zinc-200 bg-white'}`}
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
        {block.type === 'heading' && <HeadingEditor block={block} onChange={onChange} />}
        {block.type === 'text' && <TextEditor block={block} onChange={onChange} />}
        {block.type === 'archive' && <ArchiveEditor block={block} onChange={onChange} schemas={schemas} />}
        {block.type === 'field' && <FieldBlockEditor block={block} onChange={onChange} schemaFields={schemaFields} />}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EntryDetailLayoutPage() {
  const params = useParams();
  const clientId = extractParam(params, 'id');
  const schemaSlug = extractParam(params, 'slug');

  const [blocks, setBlocks] = useState<AdminBlock[]>([]);
  const [schemas, setSchemas] = useState<ContentTypeDefinition[]>([]);
  const [schema, setSchema] = useState<ContentTypeDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const sensors = useSensors(useSensor(PointerSensor));

  const load = useCallback(async () => {
    const [schemasRes, schemaRes, layoutRes] = await Promise.all([
      getAllSchemas(),
      getSchema(schemaSlug),
      getLayout(schemaSlug).catch(() => ({ data: null, error: null })),
    ]);

    if (schemasRes.error || schemaRes.error) {
      setError(schemasRes.error ?? schemaRes.error ?? 'Failed to load');
      setLoading(false);
      return;
    }

    if (!schemasRes.data || !schemaRes.data) {
      setError('Schemas or schema not found');
      setLoading(false);
      return;
    }

    setSchemas(schemasRes.data);
    setSchema(schemaRes.data);

    // Load existing layout blocks if they exist
    const existingLayout = layoutRes.data;
    const loadedBlocks: AdminBlock[] = (existingLayout?.blocks ?? [])
      .filter((b): b is AdminBlock => b.type === 'field' || b.type === 'heading' || b.type === 'text' || b.type === 'archive');

    setBlocks(loadedBlocks);
    setLoading(false);
  }, [clientId, schemaSlug]);

  useEffect(() => { load(); }, [load]);

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
    const defaults: Record<string, AdminBlock> = {
      heading: { type: 'heading', text: '', level: 2 },
      text: { type: 'text', content: '' },
      archive: { type: 'archive', schemaSlug: schemas[0]?.slug ?? '', limit: 5 },
      field: { type: 'field', fieldName: '', label: '', fieldType: 'text', value: null, visible: true, order: blocks.length },
    };
    setBlocks(prev => [...prev, defaults[type]]);
  };

  const handleSave = async () => {
    if (!schema) { setError('Schema not found'); return; }
    setSaving(true);
    setSaved(false);
    setError('');

    // Convert AdminBlock[] to Block[] for saving (all block types: heading, text, archive, field)
    const layoutBlocks: Block[] = blocks.map((b) => {
      if (b.type === 'field') {
        return {
          type: 'field' as const,
          fieldName: b.fieldName,
          label: b.label,
          fieldType: b.fieldType,
          value: null,
          visible: b.visible,
          order: b.order,
        };
      }
      return b as Block;
    });

    const { error: err } = await upsertLayout(schemaSlug, layoutBlocks);
    setSaving(false);
    if (err) { setError(err); return; }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="p-8 font-mono text-sm text-zinc-400">Loading…</div>;
  if (error) return <div className="p-8"><div className="alert-error">{error}</div></div>;

  return (
    <div className="p-8 max-w-4xl">
      {/* Breadcrumb */}
      <p className="breadcrumb mb-6 font-mono text-sm">
        <Link href={adminRoutes.clients}>Clients</Link>
        <span className="mx-1">/</span>
        <Link href={adminRoutes.clientDetail(clientId)}>Client</Link>
        <span className="mx-1">/</span>
        {schema?.name}
        <span className="mx-1">/</span>
        Entry Layout
      </p>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-heading">{schema?.name} Entry Layout</h1>
          <p className="page-sub font-mono text-sm">
            {blocks.length} block{blocks.length !== 1 ? 's' : ''} · drag to reorder
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

      {/* Blocks */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((_, i) => i)} strategy={verticalListSortingStrategy}>
          {blocks.map((block, i) => (
            <SortableBlock
              key={i}
              block={block}
              index={i}
              schemas={schemas}
              schemaFields={schema?.fields ?? []}
              onChange={b => updateBlock(i, b)}
              onRemove={() => removeBlock(i)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add block buttons */}
      <div className="mt-6 flex gap-2 flex-wrap">
        {(['heading', 'text', 'archive', 'field'] as const).map(t => (
          <button key={t} onClick={() => addBlock(t)} className="btn-secondary capitalize">
            + {t}
          </button>
        ))}
      </div>

      {/* Info note */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded text-sm font-mono">
        <p className="font-semibold text-blue-900 mb-2">Entry Layout Template</p>
        <p className="text-blue-700">
          Add static blocks (headings, text, archives) and field blocks to customize how entries from this schema are displayed.
          Field blocks are filled with entry data when rendering.
        </p>
      </div>
    </div>
  );
}
