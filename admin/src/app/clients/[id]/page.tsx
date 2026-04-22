'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Select from 'react-select';
import { Client, ContentTypeDefinition, ContentEntry, PAGE_SCHEMA_SLUG } from '@research-cms/shared-types';
import {
  formatDateTime, extractParam, adminRoutes,
} from '@/lib/utils';
import { getClient, getAllSchemas, getAllEntries, deleteEntry, updateClientSchemas, deleteClient, setClientHomePage } from '@/app/actions';
import { SectionsSkeleton } from '@/components/skeletons';

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
  const [settingHomePage, setSettingHomePage] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [clientRes, schemasRes, pagesRes] = await Promise.all([
        getClient(id),
        getAllSchemas(),
        getAllEntries(PAGE_SCHEMA_SLUG),
      ]);
      if (clientRes.error) { setError(clientRes.error); setLoading(false); return; }
      setClient(clientRes.data ?? null);
      setSchemas(schemasRes.data ?? []);
      if (pagesRes.error) { 
        console.error('Pages fetch error:', pagesRes.error);
        setPagesError(pagesRes.error);
      } else {
        console.log('Pages loaded:', pagesRes.data?.items?.length ?? 0, 'pages');
        setPages(pagesRes.data?.items ?? []);
      }
      setLoading(false);
    })();
  }, [id]);

  const currentSchemas = pendingSchemas ?? client?.allowedSchemas ?? [];
  const schemasDirty = pendingSchemas !== null;

  const handleSaveSchemas = async () => {
    if (!client?._id) return;
    setSavingSchemas(true);
    const { data, error: err } = await updateClientSchemas(client._id, currentSchemas);
    setSavingSchemas(false);
    if (err) { setError(err); return; }
    if (data) { setClient(data); setPendingSchemas(null); setSavedSchemas(true); setTimeout(() => setSavedSchemas(false), 2000); }
  };

  const handleDeleteClient = async () => {
    if (!client?._id) return;
    if (!confirm(`Delete client "${client.name}"? Apps using this key will lose access.`)) return;
    setDeletingClient(true);
    const { error: err } = await deleteClient(client._id);
    if (err) { setError(err); setDeletingClient(false); return; }
    router.push(adminRoutes.clients);
  };

  const handleDeletePage = async (pageId: string, title: string) => {
    if (!confirm(`Delete page "${title}"?`)) return;
    setDeletingPageId(pageId);
    const { error: err } = await deleteEntry(PAGE_SCHEMA_SLUG, pageId);
    if (err) { setError(err); setDeletingPageId(null); return; }
    setPages(prev => prev.filter(p => p._id !== pageId));
    setDeletingPageId(null);
    // If deleted page was home, clear it
    if (client?.homePage === pageId) setClient(prev => prev ? { ...prev, homePage: null } : prev);
  };

  const handleSetHomePage = async (pageId: string | null) => {
    if (!client?._id) return;
    setSettingHomePage(true);
    const { data, error: err } = await setClientHomePage(client._id, pageId);
    setSettingHomePage(false);
    if (err) { setError(err); return; }
    if (data) setClient(data);
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
      <div className="page">
        <div className="mb-6 space-y-2 w-1/2">
          <div className="h-8 bg-surface-container rounded animate-pulse" />
          <div className="h-4 bg-surface-container-low rounded animate-pulse" />
        </div>
        <SectionsSkeleton />
      </div>
    );
  }
  if (error && !client) return <div className="page"><div className="alert-error">{error}</div></div>;
  if (!client) return null;

  const schemaOptions: Option[] = schemas.map(s => ({ value: s.slug, label: s.name }));
  const schemaValue = schemaOptions.filter(o => currentSchemas.includes(o.value));
  const pageTree = buildTree(pages, id);

  return (
    <div className="page">
      <p className="breadcrumb mb-6">
        <Link href={adminRoutes.clients}>Clients</Link>
        <span className="mx-1">/</span>
        {client.name}
      </p>

      {error && <div className="alert-error mb-4">{error}</div>}

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6 mb-6">
        <div className="min-w-0">
          <h1 className="page-heading">{client.name}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-code text-on-surface-variant">
              <span className="text-on-surface font-bold">{client.hits.toLocaleString()}</span> hits
            </span>
            {client.lastUsedAt && <span className="text-code text-on-surface-variant hidden sm:inline">· last used {formatDateTime(client.lastUsedAt)}</span>}
            {!client.active && <span className="text-code bg-red-100 text-red-600 px-2 py-1 font-bold uppercase">inactive</span>}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Link href={adminRoutes.clientUsage(id)} className="btn-primary text-code px-3 py-2 no-underline text-center uppercase">
            Usage
          </Link>
          <button onClick={handleDeleteClient} disabled={deletingClient} className="btn-danger text-code px-3 py-2 whitespace-nowrap uppercase">
            {deletingClient ? 'Deleting…' : 'Delete client'}
          </button>
        </div>
      </div>

      {/* ── API Key ─────────────────────────────────── */}
      <section className="section">
        <p className="text-code text-on-surface-variant uppercase tracking-widest font-bold mb-3">API Key</p>
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          <code className="text-code text-on-surface-variant cursor-pointer hover:text-on-surface flex-1 truncate px-3 py-2 bg-surface-container-low font-bold uppercase"
            onClick={() => setRevealKey(r => !r)} title={revealKey ? 'Click to hide' : 'Click to reveal'}>
            {revealKey ? client.key : maskKey(client.key)}
          </code>
          <button onClick={copyKey} className="shrink-0 text-code text-on-surface-variant hover:text-on-surface border-2 border-on-surface px-2 py-1 bg-white hover:bg-surface-container transition-all font-bold uppercase whitespace-nowrap">
            {copiedKey ? '✓ copied' : 'copy'}
          </button>
        </div>
        <p className="mt-2 text-code text-on-surface-variant">Pass as <code className="font-bold">X-API-Key</code> header on all public API requests.</p>
      </section>

      {/* ── Schema access ───────────────────────────── */}
      <section className="section">
        <p className="text-code text-on-surface-variant uppercase tracking-widest font-bold mb-3">Schema Access</p>
        <p className="text-body-md text-on-surface-variant mb-3">Leave empty to allow all content types. Select specific types to restrict.</p>
        <div className="flex flex-col md:flex-row md:items-start gap-3">
          <div className="flex-1 min-w-0">
            <Select<Option, true>
              isMulti options={schemaOptions} value={schemaValue}
              onChange={opts => setPendingSchemas(opts.map(o => o.value))}
              placeholder="All schemas (unrestricted)" noOptionsMessage={() => 'No schemas found'}
              classNamePrefix="rs"
              styles={{
                control: base => ({ ...base, minHeight: 40, fontSize: 13, fontFamily: 'Inter', fontWeight: 600, borderColor: '#000000', borderWidth: 2, borderRadius: 0, boxShadow: 'none', '&:hover': { borderColor: '#000000' } }),
                menu: base => ({ ...base, fontSize: 13, fontFamily: 'Inter', fontWeight: 600, borderRadius: 0, zIndex: 30 }),
                option: (base, s) => ({ ...base, backgroundColor: s.isFocused ? '#F5F5F5' : '#FFFFFF', color: '#000000' }),
                multiValue: base => ({ ...base, backgroundColor: '#F5F5F5', borderRadius: 0 }),
                multiValueLabel: base => ({ ...base, fontSize: 12, color: '#000000', fontWeight: 600 }),
                multiValueRemove: base => ({ ...base, '&:hover': { backgroundColor: '#E5E5E5', color: '#000000' } }),
                placeholder: base => ({ ...base, color: '#5a4136' }),
              }}
            />
          </div>
          {schemasDirty && (
            <button onClick={handleSaveSchemas} disabled={savingSchemas} className="btn-primary text-code px-3 py-2 shrink-0 uppercase">
              {savingSchemas ? 'Saving…' : savedSchemas ? 'Saved ✓' : 'Save'}
            </button>
          )}
        </div>
      </section>

      {/* ── Pages ───────────────────────────────────── */}
      <section className="section">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div>
            <p className="text-code text-on-surface-variant uppercase tracking-widest font-bold">Pages</p>
            <p className="text-body-md text-on-surface-variant mt-1">Custom pages with a block editor, served via the public API.</p>
          </div>
          <Link href={adminRoutes.clientPageNew(id)} className="btn-primary text-code px-3 py-2 no-underline text-center md:text-left whitespace-nowrap uppercase">
            + New page
          </Link>
        </div>

        {pagesError && <div className="alert-error mb-3 text-code">{pagesError}</div>}

        {pages.length === 0 && !pagesError ? (
          <p className="text-body-md text-on-surface-variant pt-1">No pages yet.</p>
        ) : (
          <div className="divide-y-2 divide-on-surface">
            {pageTree.map(({ page, depth }) => {
              const isHome = client.homePage === page._id;
              return (
                <div key={page._id} className="flex items-center justify-between py-3" style={{ paddingLeft: depth * 20 }}>
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {depth > 0 && <span className="text-on-surface-variant text-code">└</span>}
                    <span className="text-body-md text-on-surface truncate font-bold uppercase">{(page.data?.title as string) ?? page._id}</span>
                    {(() => {
                      const blocks = Array.isArray(page.data?.blocks) ? page.data.blocks : [];
                      return <span className="text-code text-on-surface-variant font-bold">{blocks.length}b</span>;
                    })()}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {page._id && (() => {
                      const pageId = page._id;
                      const pageSlug = (page.data?.slug as string) ?? page._id;
                      return (
                        <>
                          <button
                            onClick={() => handleSetHomePage(isHome ? null : pageId)}
                            disabled={settingHomePage}
                            title={isHome ? 'Unset home page' : 'Set as home page'}
                            className={`text-[11px] border px-2 py-1 font-mono transition-colors ${isHome
                                ? 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-white'
                                : 'border-zinc-200 text-zinc-400 bg-white hover:text-amber-600 hover:border-amber-200'
                              }`}
                          >
                            {isHome ? '⌂ home' : '⌂'}
                          </button>
                          <Link href={adminRoutes.clientPageEdit(id, pageSlug)}
                            className="text-[11px] text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-2 py-1 bg-white hover:border-zinc-400 transition-colors font-mono no-underline">
                            Edit
                          </Link>
                          <button onClick={() => handleDeletePage(pageId, (page.data?.title as string) ?? 'Untitled')}
                            disabled={deletingPageId === pageId} className="btn-danger text-xs px-2 py-1">
                            {deletingPageId === pageId ? '…' : 'Delete'}
                          </button>
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

      {/* ── Block layouts ───────────────────────────── */}
      <section className="section">
        <p className="text-code text-on-surface-variant uppercase tracking-widest font-bold mb-1">Block Layouts</p>
        <p className="text-body-md text-on-surface-variant mb-4">
          Customise which fields are visible and in what order for this client.
        </p>
        {visibleSchemas.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">No schemas available.</p>
        ) : (
          <div className="divide-y-2 divide-on-surface">
            {visibleSchemas.map(schema => {
              const hasCustom = client.layouts.some(l => String(l.schemaId) === schema._id);
              return (
                <div key={schema.slug} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <span className="text-body-md text-on-surface font-bold uppercase">{schema.name}</span>
                    <span className="ml-2 text-code text-on-surface-variant font-bold uppercase">{schema.slug}</span>
                    {hasCustom
                      ? <span className="ml-2 text-code bg-surface-container text-on-surface border-2 border-on-surface px-2 py-1 font-bold uppercase whitespace-nowrap">customised</span>
                      : <span className="ml-2 text-code text-on-surface-variant font-bold uppercase">not customised</span>
                    }
                  </div>
                  {client._id && (
                    <Link href={adminRoutes.clientLayout(client._id, schema.slug)}
                      className="text-code text-on-surface-variant hover:text-on-surface border-2 border-on-surface px-2 py-1 bg-white hover:bg-surface-container transition-all font-bold uppercase no-underline text-center md:text-left whitespace-nowrap">
                      Edit layout
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
