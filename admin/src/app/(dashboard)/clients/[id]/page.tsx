'use client';
import { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Select from 'react-select';
import { Client, ContentTypeDefinition, ContentEntry, PAGE_SCHEMA_SLUG, SettingDefinition } from '@research-cms/shared-types';
import {
  formatDateTime, extractParam, adminRoutes,
} from '@/lib/utils';
import { getClient, getAllSchemas, getAllEntries, deleteEntry, updateClientSchemas, deleteClient, getSettings, updateSetting, type SettingItem } from '@/app/actions';
import { SectionsSkeleton } from '@/components/skeletons';
import { Button, Container, Heading, Text, TextField } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { SettingField } from '@/components/settings/SettingField';

type Option = { value: string; label: string };

/** Filter page entries by clientId and return with depth information.
 * Pages are entries in the page schema.
 */
function buildTree(entries: ContentEntry[], clientId: string): { page: ContentEntry; depth: number }[] {
  return entries
    .filter(entry => entry.data?.clientId === clientId)
    .map(page => ({ page, depth: 0 }));
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const params = useParams();
  const id = extractParam(params, 'id');
  const router = useRouter();
  const { showToast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [schemas, setSchemas] = useState<ContentTypeDefinition[]>([]);
  const [pages, setPages] = useState<ContentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagesError, setPagesError] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [revealKey, setRevealKey] = useState(false);

  const [pendingSchemas, setPendingSchemas] = useState<string[] | null>(null);
  const [savingSchemas, setSavingSchemas] = useState(false);
  const [savedSchemas, setSavedSchemas] = useState(false);

  const [deletingClient, setDeletingClient] = useState(false);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const [settingItems, setSettingItems] = useState<SettingItem[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [clientRes, schemasRes, pagesRes, settingsRes] = await Promise.all([
        getClient(id),
        getAllSchemas(),
        getAllEntries(PAGE_SCHEMA_SLUG),
        getSettings({ scope: 'client', scopeId: id }),
      ]);
      if (clientRes.error) { setError(clientRes.error); setLoading(false); return; }
      setClient(clientRes.data ?? null);
      setSchemas(schemasRes.data ?? []);
      setSettingItems(settingsRes.data ?? []);
      if (pagesRes.error) {
        console.error('Pages fetch error:', pagesRes.error);
        setPagesError(pagesRes.error);
      } else {
        setPages(pagesRes.data?.items ?? []);
      }
      setLoading(false);
    })();
  }, [id]);

  const homePageId =
    (settingItems.find(s => s.definition.key === 'client.homePage')?.value as string | null | undefined) ?? null;

  const setSettingValue = async (key: string, value: unknown) => {
    if (!id) return;
    setSavingKey(key);
    const { error: err } = await updateSetting({ scope: 'client', scopeId: id }, key, value);
    setSavingKey(null);
    if (err) { setError(err); return; }
    setSettingItems(prev => prev.map(it => it.definition.key === key ? { ...it, value } : it));
  };

  const currentSchemas = pendingSchemas ?? client?.allowedSchemas ?? [];
  const schemasDirty = pendingSchemas !== null;

  const handleSaveSchemas = async () => {
    if (!client?._id) return;
    setSavingSchemas(true);
    const { data, error: err } = await updateClientSchemas(client._id, currentSchemas);
    setSavingSchemas(false);
    if (err) { 
      showToast(err, 'error');
      setError(err); 
      return; 
    }
    if (data) { 
      setClient(data); 
      setPendingSchemas(null); 
      setSavedSchemas(true); 
      showToast('Schemas updated', 'success');
      setTimeout(() => setSavedSchemas(false), 2000); 
    }
  };

  const handleDeleteClient = async () => {
    if (!client?._id) return;
    if (!confirm(`Delete client "${client.name}"? Apps using this key will lose access.`)) return;
    setDeletingClient(true);
    const { error: err } = await deleteClient(client._id);
    if (err) { 
      showToast(err, 'error');
      setError(err); 
      setDeletingClient(false); 
      return; 
    }
    showToast(`Client "${client.name}" deleted`, 'success');
    router.push(adminRoutes.clients);
  };

  const handleDeletePage = async (pageId: string, title: string) => {
    if (!confirm(`Delete page "${title}"?`)) return;
    setDeletingPageId(pageId);
    const { error: err } = await deleteEntry(PAGE_SCHEMA_SLUG, pageId);
    if (err) { 
      showToast(err, 'error');
      setError(err); 
      setDeletingPageId(null); 
      return; 
    }
    setPages(prev => prev.filter(p => p._id !== pageId));
    setDeletingPageId(null);
    showToast(`Page deleted`, 'success');
    // If deleted page was home, clear the setting
    if (homePageId === pageId) setSettingValue('client.homePage', null);
  };

  const copyKey = async () => {
    if (!client?.key) return;
    try {
      await navigator.clipboard.writeText(client.key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch { /* ignore */ }
  };

  const maskKey = (key: string) => `${key.slice(0, 12)}${'·'.repeat(20)}${key.slice(-4)}`;

  const visibleSchemas = currentSchemas.length > 0
    ? schemas.filter(s => currentSchemas.includes(s.slug))
    : schemas;

  if (loading) {
    return (
      <Container size="lg" padding="lg">
        <div className="mb-6 space-y-2 w-1/2">
          <div className="h-8 bg-surface-container rounded animate-pulse" />
          <div className="h-4 bg-surface-container-low rounded animate-pulse" />
        </div>
        <SectionsSkeleton />
      </Container>
    );
  }
  if (error && !client) {
    return (
      <Container size="lg" padding="lg">
        <div className="border-2 border-error bg-surface px-4 py-3">
          <Text variant="body-sm" color="error">{error}</Text>
        </div>
      </Container>
    );
  }
  if (!client) return null;

  const schemaOptions: Option[] = schemas.map(s => ({ value: s.slug, label: s.name }));
  const schemaValue = schemaOptions.filter(o => currentSchemas.includes(o.value));
  const pageTree = buildTree(pages, id);

  return (
    <Container size="lg" padding="lg">
      <Text variant="caption" color="secondary" className="mb-6 uppercase tracking-widest font-bold">
        <Link href={adminRoutes.clients} className="hover:text-on-surface">Clients</Link>
        <span className="mx-1">/</span>
        {client.name}
      </Text>

      {error && (
        <div className="mb-4 border-2 border-error bg-surface px-4 py-3">
          <Text variant="body-sm" color="error">{error}</Text>
        </div>
      )}

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6 mb-6">
        <div className="min-w-0">
          <Heading level={1}>{client.name}</Heading>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Text variant="code" color="secondary" as="span">
              <span className="text-on-surface font-bold">{client.hits.toLocaleString()}</span> hits
            </Text>
            {client.lastUsedAt && (
              <Text variant="code" color="secondary" as="span" className="hidden sm:inline">
                · last used {formatDateTime(client.lastUsedAt)}
              </Text>
            )}
            {!client.active && (
              <span className="text-code bg-surface text-error border-2 border-error px-2 py-1 font-bold uppercase">
                inactive
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Link href={adminRoutes.clientUsage(id)} className="no-underline">
            <Button variant="primary" size="sm" className="w-full">Usage</Button>
          </Link>
          <Button
            onClick={handleDeleteClient}
            disabled={deletingClient}
            variant="destructive"
            size="sm"
            className="whitespace-nowrap"
          >
            {deletingClient ? 'Deleting…' : 'Delete client'}
          </Button>
        </div>
      </div>

      {/* ── API Key ─────────────────────────────────── */}
      <section className="section">
        <Heading level={3} className="mb-3">API Key</Heading>
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          <code
            className="text-code text-on-surface-variant cursor-pointer hover:text-on-surface flex-1 truncate px-3 py-2 bg-surface-container-low font-bold uppercase border-2 border-on-surface"
            onClick={() => setRevealKey(r => !r)}
            title={revealKey ? 'Click to hide' : 'Click to reveal'}
          >
            {revealKey ? client.key : maskKey(client.key)}
          </code>
          <Button onClick={copyKey} variant="secondary" size="sm" className="shrink-0 whitespace-nowrap">
            {copiedKey ? '✓ copied' : 'copy'}
          </Button>
        </div>
        <Text variant="code" color="secondary" className="mt-2">
          Pass as <code className="font-bold">X-API-Key</code> header on all public API requests.
        </Text>
      </section>

      {/* ── Schema access ───────────────────────────── */}
      <section className="section">
        <Heading level={3} className="mb-3">Schema Access</Heading>
        <Text variant="body-md" color="secondary" className="mb-3">
          Leave empty to allow all content types. Select specific types to restrict.
        </Text>
        <div className="flex flex-col md:flex-row md:items-start gap-3">
          <div className="flex-1 min-w-0">
            <Select<Option, true>
              isMulti options={schemaOptions} value={schemaValue}
              onChange={opts => setPendingSchemas(opts.map(o => o.value))}
              placeholder="All schemas (unrestricted)" noOptionsMessage={() => 'No schemas found'}
              classNamePrefix="rs"
              styles={{
                control: base => ({ ...base, minHeight: 40, fontSize: 13, fontFamily: 'Inter', fontWeight: 600, borderColor: '#000000', borderWidth: 2, borderRadius: 0, boxShadow: 'none', '&:hover': { borderColor: '#000000' } }),
                menu: base => ({ ...base, fontSize: 13, fontFamily: 'Inter', fontWeight: 600, borderRadius: 0, zIndex: 30, border: '2px solid #000', boxShadow: '4px 4px 0 #000' }),
                option: (base, s) => ({ ...base, backgroundColor: s.isFocused ? '#F5F5F5' : '#FFFFFF', color: '#000000' }),
                multiValue: base => ({ ...base, backgroundColor: '#F5F5F5', borderRadius: 0 }),
                multiValueLabel: base => ({ ...base, fontSize: 12, color: '#000000', fontWeight: 600 }),
                multiValueRemove: base => ({ ...base, '&:hover': { backgroundColor: '#E5E5E5', color: '#000000' } }),
                placeholder: base => ({ ...base, color: '#5a4136' }),
              }}
            />
          </div>
          {schemasDirty && (
            <Button
              onClick={handleSaveSchemas}
              disabled={savingSchemas}
              variant="primary"
              size="sm"
              className="shrink-0"
            >
              {savingSchemas ? 'Saving…' : savedSchemas ? 'Saved ✓' : 'Save'}
            </Button>
          )}
        </div>
      </section>

      {/* ── Pages ───────────────────────────────────── */}
      <section className="section">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div>
            <Heading level={3}>Pages</Heading>
            <Text variant="body-md" color="secondary" className="mt-1">
              Custom pages with a block editor, served via the public API.
            </Text>
          </div>
          <Link href={adminRoutes.clientPageNew(id)} className="no-underline">
            <Button variant="primary" size="sm" className="whitespace-nowrap">+ New page</Button>
          </Link>
        </div>

        {pagesError && (
          <div className="mb-3 border-2 border-error bg-surface px-4 py-3">
            <Text variant="body-sm" color="error">{pagesError}</Text>
          </div>
        )}

        {pages.length === 0 && !pagesError ? (
          <Text variant="body-md" color="secondary" className="pt-1">No pages yet.</Text>
        ) : (
          <div className="divide-y-2 divide-on-surface">
            {pageTree.map(({ page, depth }) => {
              const isHome = homePageId === page._id;
              return (
                <div key={page._id} className="flex items-center justify-between py-3" style={{ paddingLeft: depth * 20 }}>
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {depth > 0 && <Text variant="code" color="secondary" as="span">└</Text>}
                    <Text variant="body-md" as="span" className="truncate font-bold uppercase">
                      {(page.data?.title as string) ?? page._id}
                    </Text>
                    {isHome && (
                      <span className="text-code bg-primary text-white border-2 border-on-surface px-2 py-1 font-bold uppercase">
                        ⌂ home
                      </span>
                    )}
                    {(() => {
                      const blocks = Array.isArray(page.data?.blocks) ? page.data.blocks : [];
                      return <Text variant="code" color="secondary" as="span" className="font-bold">{blocks.length}b</Text>;
                    })()}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {page._id && (() => {
                      const pageId = page._id;
                      const pageSlug = (page.data?.slug as string) ?? page._id;
                      return (
                        <>
                          <Link href={adminRoutes.clientPageEdit(id, pageSlug)} className="no-underline">
                            <Button variant="secondary" size="xs">Edit</Button>
                          </Link>
                          <Button
                            onClick={() => handleDeletePage(pageId, (page.data?.title as string) ?? 'Untitled')}
                            disabled={deletingPageId === pageId}
                            variant="destructive"
                            size="xs"
                          >
                            {deletingPageId === pageId ? '…' : 'Delete'}
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Menus ────────────────────────────────────── */}
      <section className="section">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <Heading level={3}>Menus</Heading>
            <Text variant="body-md" color="secondary" className="mt-1">
              Navigations and link collections for this client.
            </Text>
          </div>
          <Link href={adminRoutes.clientMenus(id)} className="no-underline">
            <Button variant="secondary" size="sm" className="whitespace-nowrap">Manage menus</Button>
          </Link>
        </div>
      </section>

      {/* ── Block layouts ───────────────────────────── */}
      <section className="section">
        <Heading level={3} className="mb-1">Block Layouts</Heading>
        <Text variant="body-md" color="secondary" className="mb-4">
          Customise which fields are visible and in what order for this client.
        </Text>
        {visibleSchemas.length === 0 ? (
          <Text variant="body-md" color="secondary">No schemas available.</Text>
        ) : (
          <div className="divide-y-2 divide-on-surface">
            {visibleSchemas.map(schema => {
              const hasCustom = client.layouts.some(l => String(l.schemaId) === schema._id);
              return (
                <div key={schema.slug} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Text variant="body-md" as="span" className="font-bold uppercase">{schema.name}</Text>
                    <Text variant="code" color="secondary" as="span" className="ml-2 font-bold uppercase">{schema.slug}</Text>
                    {hasCustom ? (
                      <span className="ml-2 text-code bg-surface-container text-on-surface border-2 border-on-surface px-2 py-1 font-bold uppercase whitespace-nowrap">
                        customised
                      </span>
                    ) : (
                      <Text variant="code" color="secondary" as="span" className="ml-2 font-bold uppercase">not customised</Text>
                    )}
                  </div>
                  {client._id && (
                    <Link href={adminRoutes.clientLayout(client._id, schema.slug)} className="no-underline">
                      <Button variant="secondary" size="sm" className="whitespace-nowrap">Edit layout</Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Settings ────────────────────────────────── */}
      <section className="section">
        <Heading level={3} className="mb-1">Settings</Heading>
        <Text variant="body-md" color="secondary" className="mb-4">
          Per-client configuration. Changes save automatically.
        </Text>
        {settingItems.length === 0 ? (
          <Text variant="body-md" color="secondary">No settings registered for clients.</Text>
        ) : (
          <div className="flex flex-col gap-4">
            {settingItems.map(item => (
              <SettingField
                key={item.definition.key}
                definition={item.definition}
                value={item.value}
                saving={savingKey === item.definition.key}
                pages={pageTree.map(({ page }) => page)}
                clientId={id}
                onChange={value => setSettingValue(item.definition.key, value)}
              />
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
