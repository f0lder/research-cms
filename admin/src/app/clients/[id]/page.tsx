'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Select from 'react-select';
import { Client, ClientPage, ContentTypeDefinition } from '@research-cms/shared-types';
import {
  formatDateTime, extractParam, adminRoutes,
} from '@/lib/utils';
import { getClient, getAllSchemas, listClientPages, deleteClientPage, updateClientSchemas, deleteClient, setClientHomePage } from '@/app/actions';
import { SectionsSkeleton } from '@/components/skeletons';

type Option = { value: string; label: string };

/** Builds an indented tree from a flat pages array. */
function buildTree(pages: ClientPage[]): { page: ClientPage; depth: number }[] {
  const result: { page: ClientPage; depth: number }[] = [];

  function walk(parentId: string | null | undefined, depth: number) {
    pages
      .filter(p => (p.parentId ?? null) === (parentId ?? null))
      .forEach(p => {
        result.push({ page: p, depth });
        walk(p._id, depth + 1);
      });
  }
  walk(null, 0);

  // Append any orphaned pages (parentId references a deleted page)
  const rendered = new Set(result.map(r => r.page._id).filter(Boolean));
  pages.filter(p => p._id && !rendered.has(p._id)).forEach(p => result.push({ page: p, depth: 0 }));

  return result;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const params = useParams();
  const id = extractParam(params, 'id');
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [schemas, setSchemas] = useState<ContentTypeDefinition[]>([]);
  const [pages, setPages] = useState<ClientPage[]>([]);
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
      const [clientRes, schemasRes, pagesRes] = await Promise.all([getClient(id), getAllSchemas(), listClientPages(id)]);
      console.log('Client data fetch completed:', { clientRes, schemasRes, pagesRes });
      if (clientRes.error) { setError(clientRes.error); setLoading(false); return; }
      setClient(clientRes.data ?? null);
      setSchemas(schemasRes.data ?? []);
      if (pagesRes.error) { 
        console.error('Pages fetch error:', pagesRes.error);
        setPagesError(pagesRes.error);
      } else {
        console.log('Pages loaded:', pagesRes.data?.length ?? 0, 'pages');
        setPages(pagesRes.data ?? []);
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
    const { error: err } = await deleteClientPage(id, pageId);
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
      <div className="p-8 font-mono max-w-3xl">
        <div className="mb-6 space-y-2 w-1/2">
          <div className="h-8 bg-zinc-200 rounded animate-pulse" />
          <div className="h-4 bg-zinc-100 rounded animate-pulse" />
        </div>
        <SectionsSkeleton />
      </div>
    );
  }
  if (error && !client) return <div className="p-8"><div className="alert-error">{error}</div></div>;
  if (!client) return null;

  const schemaOptions: Option[] = schemas.map(s => ({ value: s.slug, label: s.name }));
  const schemaValue = schemaOptions.filter(o => currentSchemas.includes(o.value));
  const pageTree = buildTree(pages);

  return (
    <div className="p-8 font-mono max-w-3xl">
      <p className="breadcrumb mb-6">
        <Link href={adminRoutes.clients}>Clients</Link>
        <span className="mx-1">/</span>
        {client.name}
      </p>

      {error && <div className="alert-error mb-4">{error}</div>}

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-heading">{client.name}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-zinc-400">
              <span className="text-zinc-600 font-semibold">{client.hits.toLocaleString()}</span> hits
            </span>
            {client.lastUsedAt && <span className="text-xs text-zinc-400">· last used {formatDateTime(client.lastUsedAt)}</span>}
            {!client.active && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 font-mono">inactive</span>}
          </div>
        </div>
        <button onClick={handleDeleteClient} disabled={deletingClient} className="btn-danger text-xs px-3 py-1.5">
          {deletingClient ? 'Deleting…' : 'Delete client'}
        </button>
      </div>

      {/* ── API Key ─────────────────────────────────── */}
      <section className="mb-6 border border-zinc-200 p-4">
        <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold mb-3">API Key</p>
        <div className="flex items-center gap-3">
          <code className="text-[11px] font-mono text-zinc-500 cursor-pointer hover:text-zinc-700 flex-1 truncate"
            onClick={() => setRevealKey(r => !r)} title={revealKey ? 'Click to hide' : 'Click to reveal'}>
            {revealKey ? client.key : maskKey(client.key)}
          </code>
          <button onClick={copyKey} className="shrink-0 text-[10px] text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-2 py-0.5 bg-white hover:border-zinc-400 transition-colors font-mono">
            {copiedKey ? '✓ copied' : 'copy'}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-zinc-400">Pass as <code className="font-mono">X-API-Key</code> header on all public API requests.</p>
      </section>

      {/* ── Schema access ───────────────────────────── */}
      <section className="mb-6 border border-zinc-200 p-4">
        <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold mb-3">Schema Access</p>
        <p className="text-xs text-zinc-400 mb-3">Leave empty to allow all content types. Select specific types to restrict.</p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Select<Option, true>
              isMulti options={schemaOptions} value={schemaValue}
              onChange={opts => setPendingSchemas(opts.map(o => o.value))}
              placeholder="All schemas (unrestricted)" noOptionsMessage={() => 'No schemas found'}
              classNamePrefix="rs"
              styles={{
                control: base => ({ ...base, minHeight: 32, fontSize: 12, fontFamily: 'monospace', borderColor: '#e4e4e7', borderRadius: 2, boxShadow: 'none', '&:hover': { borderColor: '#a1a1aa' } }),
                menu: base => ({ ...base, fontSize: 12, fontFamily: 'monospace', borderRadius: 2, zIndex: 30 }),
                option: (base, s) => ({ ...base, backgroundColor: s.isFocused ? '#f4f4f5' : 'white', color: '#18181b' }),
                multiValue: base => ({ ...base, backgroundColor: '#f4f4f5', borderRadius: 2 }),
                multiValueLabel: base => ({ ...base, fontSize: 11, color: '#3f3f46' }),
                multiValueRemove: base => ({ ...base, '&:hover': { backgroundColor: '#e4e4e7', color: '#18181b' } }),
                placeholder: base => ({ ...base, color: '#a1a1aa' }),
              }}
            />
          </div>
          {schemasDirty && (
            <button onClick={handleSaveSchemas} disabled={savingSchemas} className="btn-primary text-xs px-3 py-1.5 shrink-0">
              {savingSchemas ? 'Saving…' : savedSchemas ? 'Saved ✓' : 'Save'}
            </button>
          )}
        </div>
      </section>

      {/* ── Pages ───────────────────────────────────── */}
      <section className="mb-6 border border-zinc-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Pages</p>
            <p className="text-xs text-zinc-400 mt-0.5">Custom pages with a block editor, served via the public API.</p>
          </div>
          <Link href={adminRoutes.clientPageNew(id)} className="btn-primary text-xs px-3 py-1.5 no-underline">
            + New page
          </Link>
        </div>

        {pagesError && <div className="alert-error mb-3 text-xs">{pagesError}</div>}

        {pages.length === 0 && !pagesError ? (
          <p className="text-xs text-zinc-400 pt-1">No pages yet.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {pageTree.map(({ page, depth }) => {
              const isHome = client.homePage === page._id;
              return (
                <div key={page._id} className="flex items-center justify-between py-3" style={{ paddingLeft: depth * 20 }}>
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {depth > 0 && <span className="text-zinc-300 text-xs">└</span>}
                    <span className="text-sm text-zinc-700 truncate">{page.title}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">/{page.slug}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 font-mono ${page.status === 'published'
                        ? 'bg-green-50 text-green-600 border border-green-200'
                        : 'bg-zinc-100 text-zinc-500'
                      }`}>{page.status}</span>
                    {isHome && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 font-mono">home</span>
                    )}
                    <span className="text-[10px] text-zinc-300 font-mono">{page.blocks.length}b</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {page._id && (() => {
                      const pageId = page._id;
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
                          <Link href={adminRoutes.clientPageEdit(id, pageId)}
                            className="text-[11px] text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-2 py-1 bg-white hover:border-zinc-400 transition-colors font-mono no-underline">
                            Edit
                          </Link>
                          <button onClick={() => handleDeletePage(pageId, page.title)}
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
      <section className="border border-zinc-200 p-4">
        <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold mb-1">Block Layouts</p>
        <p className="text-xs text-zinc-400 mb-4">
          Customise which fields are visible and in what order for this client.
        </p>
        {visibleSchemas.length === 0 ? (
          <p className="text-xs text-zinc-400">No schemas available.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {visibleSchemas.map(schema => {
              const hasCustom = client.layouts.some(l => l.schemaSlug === schema.slug);
              return (
                <div key={schema.slug} className="flex items-center justify-between py-3">
                  <div>
                    <span className="text-sm text-zinc-700">{schema.name}</span>
                    <span className="ml-2 text-[10px] text-zinc-400 font-mono">{schema.slug}</span>
                    {hasCustom
                      ? <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 font-mono">customised</span>
                      : <span className="ml-2 text-[10px] text-zinc-400 font-mono">not customised</span>
                    }
                  </div>
                  {client._id && (
                    <Link href={adminRoutes.clientLayout(client._id, schema.slug)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-2 py-1 bg-white hover:border-zinc-400 transition-colors font-mono no-underline">
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
