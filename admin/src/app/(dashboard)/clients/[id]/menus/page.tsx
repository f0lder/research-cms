'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Menu } from '@research-cms/shared-types';
import { extractParam, adminRoutes, generateSlugFromName } from '@/lib/utils';
import { getClient, getClientMenus, createClientMenu, deleteClientMenu } from '@/app/actions';
import { Button, Container, Heading, Text, Modal, TextField, Breadcrumb } from '@/components/ui';
import { LuKey, LuMenu } from 'react-icons/lu';
import { useToast } from '@/contexts/ToastContext';

export default function MenusListPage() {
  const params = useParams();
  const id = extractParam(params, 'id');
  const { showToast } = useToast();

  const [clientName, setClientName] = useState('');
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [clientRes, menusRes] = await Promise.all([
        getClient(id),
        getClientMenus(id),
      ]);
      if (clientRes.error) { setError(clientRes.error); setLoading(false); return; }
      setClientName(clientRes.data?.name ?? '');
      setMenus(menusRes.data ?? []);
      setLoading(false);
    })();
  }, [id]);

  const handleNameChange = (value: string) => {
    setNewName(value);
    setNewSlug(generateSlugFromName(value));
  };

  const handleCreate = async () => {
    if (!id || !newName.trim() || !newSlug.trim()) return;
    setCreating(true);
    const { data, error: err } = await createClientMenu(id, {
      name: newName.trim(),
      slug: newSlug.trim(),
      slot: newSlot.trim() || undefined,
    });
    setCreating(false);
    if (err) { showToast(err, 'error'); return; }
    if (data) {
      setMenus(prev => [...prev, data]);
      setShowCreateModal(false);
      setNewName('');
      setNewSlug('');
      setNewSlot('');
      showToast('Menu created', 'success');
    }
  };

  const handleDelete = async (menu: Menu) => {
    if (!id || !menu._id) return;
    if (!confirm(`Delete menu "${menu.name}"?`)) return;
    const { error: err } = await deleteClientMenu(id, menu._id);
    if (err) { showToast(err, 'error'); return; }
    setMenus(prev => prev.filter(m => m._id !== menu._id));
    showToast('Menu deleted', 'success');
  };

  if (loading) {
    return (
      <Container size="lg" padding="lg">
        <div className="mb-6 space-y-2 w-1/2">
          <div className="h-8 bg-surface-container rounded animate-pulse" />
          <div className="h-4 bg-surface-container-low rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-container rounded animate-pulse" />)}
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
          { label: 'Menus', icon: LuMenu },
        ]}
      />

      {error && (
        <div className="mb-4 border-2 border-error bg-surface px-4 py-3">
          <Text variant="body-sm" color="error">{error}</Text>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <Heading level={1}>Menus</Heading>
          <Text variant="body-md" color="secondary" className="mt-1">
            Navigations and link collections for <strong>{clientName}</strong>.
          </Text>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="whitespace-nowrap">
          + New Menu
        </Button>
      </div>

      {menus.length === 0 ? (
        <div className="border-2 border-on-surface p-12 text-center">
          <Heading level={3} className="mb-2">No menus yet</Heading>
          <Text variant="body-md" color="secondary" className="mb-4">
            Create your first menu to start building navigation for this client.
          </Text>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>+ Create Menu</Button>
        </div>
      ) : (
        <div className="divide-y-2 divide-on-surface">
          {menus.map(menu => (
            <div key={menu._id} className="flex items-center justify-between py-4">
              <div className="min-w-0">
                <Text variant="body-md" as="span" className="font-bold uppercase">
                  {menu.name}
                </Text>
                <Text variant="code" color="secondary" as="span" className="ml-2 font-bold">
                  /{menu.slug}
                </Text>
                {menu.slot && (
                  <Text variant="code" className="ml-2 bg-surface-container border-2 border-on-surface px-2 py-0.5 font-bold uppercase">
                    slot: {menu.slot}
                  </Text>
                )}
                <Text variant="code" color="secondary" as="div" className="mt-1">
                  {menu.items.length} item{menu.items.length !== 1 ? 's' : ''}
                </Text>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <Link href={adminRoutes.clientMenuEdit(id, menu._id!)} className="no-underline">
                  <Button variant="secondary" size="sm">Edit</Button>
                </Link>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(menu)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => !creating && setShowCreateModal(false)}
        title="Create Menu"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)} disabled={creating}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={creating || !newName.trim() || !newSlug.trim()}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Name" value={newName} onChange={e => handleNameChange(e.target.value)} placeholder="Main Navigation" disabled={creating} />
          <TextField label="Slug" value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="main-nav" disabled={creating} />
          <TextField label="Slot (optional)" value={newSlot} onChange={e => setNewSlot(e.target.value)} placeholder="header, footer, bottom_tabs, …" disabled={creating} />
        </div>
      </Modal>
    </Container>
  );
}
