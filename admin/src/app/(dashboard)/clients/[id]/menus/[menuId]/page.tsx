'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Menu, MenuItem, MenuItemType } from '@research-cms/shared-types';
import { extractParam, adminRoutes, generateRandomId } from '@/lib/utils';
import { getClient, getClientMenu, updateClientMenu } from '@/app/actions';
import { Button, Container, Heading, Text, TextField, Modal, Breadcrumb } from '@/components/ui';
import { PagePickerSelect, SchemaPickerSelect, EntryPickerSelect } from '@/components/ui';
import { LuKey, LuMenu } from 'react-icons/lu';
import { useToast } from '@/contexts/ToastContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type MenuItemFormData = {
  id: string;
  label: string;
  type: MenuItemType;
  pageSlug?: string;
  schemaSlug?: string;
  entryId?: string;
  archiveSchema?: string;
  url?: string;
};

function SortableItem({ item, onEdit, onDelete }: { item: MenuItem; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeLabel: Record<MenuItemType, string> = {
    page: 'Page',
    entry: 'Entry',
    archive: 'Archive',
    external: 'External',
  };

  const typeDetail = (item: MenuItem): string => {
    switch (item.type) {
      case 'page': return item.pageSlug ?? '';
      case 'entry': return `${item.schemaSlug ?? ''} / ${item.entryId?.slice(-6) ?? ''}`;
      case 'archive': return item.archiveSchema ?? '';
      case 'external': return item.url ?? '';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 border-2 border-on-surface p-3 bg-white">
      <button {...attributes} {...listeners} className="cursor-grab text-on-surface-variant hover:text-on-surface text-lg font-bold px-1">
        ⠿
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Text variant="body-md" as="span" className="font-bold uppercase">{item.label}</Text>
          <Text variant="code" className="bg-surface-container border border-on-surface px-1.5 py-0.5 font-bold uppercase text-xs">
            {typeLabel[item.type]}
          </Text>
        </div>
        <Text variant="code" color="secondary" className="text-xs truncate block">
          {typeDetail(item)}
        </Text>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="secondary" size="xs" onClick={onEdit}>Edit</Button>
        <Button variant="destructive" size="xs" onClick={onDelete}>×</Button>
      </div>
    </div>
  );
}

export default function MenuEditorPage() {
  const params = useParams();
  const id = extractParam(params, 'id');
  const menuId = extractParam(params, 'menuId');
  const { showToast } = useToast();

  const [clientName, setClientName] = useState('');
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slot, setSlot] = useState('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [dirty, setDirty] = useState(false);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<MenuItemFormData>({
    id: '', label: '', type: 'page',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!id || !menuId) return;
    (async () => {
      const [clientRes, menuRes] = await Promise.all([
        getClient(id),
        getClientMenu(id, menuId),
      ]);
      if (clientRes.error) { setError(clientRes.error); setLoading(false); return; }
      if (menuRes.error) { setError(menuRes.error); setLoading(false); return; }
      setClientName(clientRes.data?.name ?? '');
      const m = menuRes.data!;
      setMenu(m);
      setName(m.name);
      setSlug(m.slug);
      setSlot(m.slot ?? '');
      setItems([...m.items].sort((a, b) => a.order - b.order));
      setLoading(false);
    })();
  }, [id, menuId]);

  const markDirty = useCallback(() => setDirty(true), []);

  const handleSave = async () => {
    if (!id || !menuId) return;
    setSaving(true);
    const reindexed = items.map((item, i) => ({ ...item, order: i }));
    const { error: err } = await updateClientMenu(id, menuId, {
      name: name.trim(),
      slug: slug.trim(),
      slot: slot.trim() || undefined,
      items: reindexed,
    });
    setSaving(false);
    if (err) { showToast(err, 'error'); return; }
    setDirty(false);
    showToast('Menu saved', 'success');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems(prev => {
      const oldIndex = prev.findIndex(i => i.id === active.id);
      const newIndex = prev.findIndex(i => i.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setDirty(true);
  };

  const openAddItem = () => {
    setEditingItemId(null);
    setItemForm({ id: generateRandomId(), label: '', type: 'page' });
    setShowItemModal(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItemId(item.id);
    setItemForm({
      id: item.id,
      label: item.label,
      type: item.type,
      pageSlug: item.pageSlug,
      schemaSlug: item.schemaSlug,
      entryId: item.entryId,
      archiveSchema: item.archiveSchema,
      url: item.url,
    });
    setShowItemModal(true);
  };

  const handleSaveItem = () => {
    if (!itemForm.label.trim()) return;
    if (editingItemId) {
      setItems(prev => prev.map(i => i.id === editingItemId ? { ...i, ...itemForm, label: itemForm.label.trim() } : i));
    } else {
      setItems(prev => [...prev, { ...itemForm, label: itemForm.label.trim(), order: prev.length }]);
    }
    setShowItemModal(false);
    setDirty(true);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!confirm('Remove this item?')) return;
    setItems(prev => prev.filter(i => i.id !== itemId));
    setDirty(true);
  };

  const itemTypeOptions: { value: MenuItemType; label: string }[] = [
    { value: 'page', label: 'Page' },
    { value: 'entry', label: 'Entry' },
    { value: 'archive', label: 'Archive' },
    { value: 'external', label: 'External URL' },
  ];

  if (loading) {
    return (
      <Container size="lg" padding="lg">
        <div className="mb-6 space-y-2 w-1/2">
          <div className="h-8 bg-surface-container rounded animate-pulse" />
          <div className="h-4 bg-surface-container-low rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-16 bg-surface-container rounded animate-pulse" />
          <div className="h-16 bg-surface-container rounded animate-pulse" />
        </div>
      </Container>
    );
  }

  return (
    <Container size="lg" padding="lg">
      <Breadcrumb
        items={[
          { label: 'Clients', href: adminRoutes.clients, icon: LuKey },
          { label: clientName, href: adminRoutes.clientDetail(id) },
          { label: 'Menus', href: adminRoutes.clientMenus(id), icon: LuMenu },
          { label: menu?.name ?? 'Edit' },
        ]}
      />

      {error && (
        <div className="mb-4 border-2 border-error bg-surface px-4 py-3">
          <Text variant="body-sm" color="error">{error}</Text>
        </div>
      )}

      <Heading level={1} className="mb-6">Edit Menu</Heading>

      <div className="space-y-4 mb-6">
        <TextField label="Name" value={name} onChange={e => { setName(e.target.value); markDirty(); }} placeholder="Main Navigation" />
        <TextField label="Slug" value={slug} onChange={e => { setSlug(e.target.value); markDirty(); }} placeholder="main-nav" />
        <TextField label="Slot" value={slot} onChange={e => { setSlot(e.target.value); markDirty(); }} placeholder="header, footer, bottom_tabs, …" />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <Heading level={3}>Menu Items</Heading>
          <Button variant="primary" size="sm" onClick={openAddItem}>+ Add Item</Button>
        </div>

        {items.length === 0 ? (
          <div className="border-2 border-dashed border-on-surface p-8 text-center">
            <Text variant="body-md" color="secondary" className="mb-3">No items yet.</Text>
            <Button variant="secondary" size="sm" onClick={openAddItem}>+ Add first item</Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map(item => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    onEdit={() => openEditItem(item)}
                    onDelete={() => handleDeleteItem(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="flex items-center gap-3 pt-4 border-t-2 border-on-surface">
        <Button variant="primary" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? 'Saving…' : 'Save Menu'}
        </Button>
        <Link href={adminRoutes.clientMenus(id)} className="no-underline">
          <Button variant="ghost">Cancel</Button>
        </Link>
      </div>

      <Modal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        title={editingItemId ? 'Edit Item' : 'Add Item'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowItemModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveItem} disabled={!itemForm.label.trim()}>
              {editingItemId ? 'Save' : 'Add Item'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Label" value={itemForm.label} onChange={e => setItemForm(prev => ({ ...prev, label: e.target.value }))} placeholder="Home" />

          <div>
            <Text variant="label" className="mb-2 block">Type</Text>
            <div className="flex flex-wrap gap-2">
              {itemTypeOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setItemForm(prev => ({ ...prev, type: opt.value, pageSlug: undefined, schemaSlug: undefined, entryId: undefined, archiveSchema: undefined, url: undefined }))}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-widest border-2 transition-all ${
                    itemForm.type === opt.value
                      ? 'bg-on-surface text-surface border-on-surface'
                      : 'bg-surface text-on-surface border-on-surface hover:bg-surface-container'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {itemForm.type === 'page' && (
            <PagePickerSelect
              label={<Text variant="label" className="mb-2 block">Page</Text>}
              clientId={id}
              value={itemForm.pageSlug ?? ''}
              onChange={v => setItemForm(prev => ({ ...prev, pageSlug: v as string | undefined }))}
            />
          )}

          {itemForm.type === 'entry' && (
            <>
              <SchemaPickerSelect
                label={<Text variant="label" className="mb-2 block">Schema</Text>}
                value={itemForm.schemaSlug ?? ''}
                onChange={v => setItemForm(prev => ({ ...prev, schemaSlug: v as string | undefined, entryId: undefined }))}
              />
              {itemForm.schemaSlug && (
                <EntryPickerSelect
                  label={<Text variant="label" className="mb-2 block">Entry</Text>}
                  schemaSlug={itemForm.schemaSlug}
                  value={itemForm.entryId ?? ''}
                  onChange={v => setItemForm(prev => ({ ...prev, entryId: v as string | undefined }))}
                />
              )}
            </>
          )}

          {itemForm.type === 'archive' && (
            <SchemaPickerSelect
              label={<Text variant="label" className="mb-2 block">Schema (archive)</Text>}
              value={itemForm.archiveSchema ?? ''}
              onChange={v => setItemForm(prev => ({ ...prev, archiveSchema: v as string | undefined }))}
            />
          )}

          {itemForm.type === 'external' && (
            <TextField
              label="URL"
              value={itemForm.url ?? ''}
              onChange={e => setItemForm(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
            />
          )}
        </div>
      </Modal>
    </Container>
  );
}
