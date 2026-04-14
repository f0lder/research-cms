'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Block, blockRegistry, registerBuiltInBlocks, PAGE_SCHEMA_SLUG, ContentEntry } from '@research-cms/shared-types';
import { extractParam, adminRoutes } from '@/lib/utils';
import { createEntry, updateEntry, getEntry } from '@/app/actions';
import { setClientHomePage } from '@/app/actions';
import { BlocksEditor } from '@/components/blocks';


const IS_NEW = '_new';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PageEditorPage() {
  const params = useParams();
  const clientId = extractParam(params, 'id');
  const pageId = extractParam(params, 'pageId');
  const isNew = pageId === IS_NEW;

  const [pageEntry, setPageEntry] = useState<ContentEntry | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [settingHomePage, setSettingHomePage] = useState(false);

  // Initialize block registry on client side
  useEffect(() => {
    registerBuiltInBlocks();
  }, []);

  const load = useCallback(async () => {
    if (isNew) {
      setLoading(false);
      return;
    }
    
    // Load the page entry from the page schema (contains all page data including blocks)
    const { data: entryData, error: entryErr } = await getEntry(PAGE_SCHEMA_SLUG, pageId);
    if (entryErr) { setError(entryErr); setLoading(false); return; }
    
    if (entryData) {
      // Populate form fields from entry data
      setPageEntry(entryData as ContentEntry);
      setTitle((entryData.data?.title as string) ?? '');
      setSlug((entryData.data?.slug as string) ?? '');
      setDescription((entryData.data?.description as string) ?? '');
      
      // Load blocks from page entry data
      const blocksData = entryData.data?.blocks;
      if (blocksData) {
        // Blocks are now stored as Block[] directly, not JSON
        const blocksList = (Array.isArray(blocksData) ? blocksData : []) as Block[];
        setBlocks(blocksList.filter((b): b is Block => b.type !== 'field'));
      }
    }
    
    setLoading(false);
  }, [clientId, pageId, isNew]);

  useEffect(() => { load(); }, [load]);

  // Auto-generate slug from title on new pages
  useEffect(() => {
    if (isNew && title && !slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  }, [title, slug, isNew]);

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) { setError('Title and slug are required.'); return; }
    setSaving(true);
    setSaved(false);
    setError('');

    const trimmedDescription = description.trim();
    const entryData = {
      clientId,
      title: title.trim(),
      slug: slug.trim(),
      ...(trimmedDescription && { description: trimmedDescription }),
      blocks, // Directly store blocks array (not JSON)
    };

    if (isNew) {
      // Create page entry
      const { data: entry, error: entryErr } = await createEntry(PAGE_SCHEMA_SLUG, entryData);
      if (entryErr) { setSaving(false); setError(entryErr); return; }
      if (!entry?._id) { setSaving(false); setError('Failed to create page entry'); return; }
      setPageEntry(entry);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Redirect to edit URL
      window.history.replaceState(null, '', `${clientId}/pages/${entry._id}`);
    } else if (pageEntry?._id) {
      // Update page entry
      const { error: entryErr } = await updateEntry(PAGE_SCHEMA_SLUG, pageEntry._id, entryData);
      if (entryErr) { setSaving(false); setError(entryErr); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleSetHomePage = async () => {
    if (!pageEntry?._id) return;
    setSettingHomePage(true);
    try {
      const { error: err } = await setClientHomePage(clientId, pageEntry._id);
      if (err) { setError(err); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to set home page');
    } finally {
      setSettingHomePage(false);
    }
  };

  if (loading) return <div className="page text-sm text-zinc-400">Loading…</div>;

  if (error) {
    return (
      <div className="page">
        <div className="alert-error">{error}</div>
      </div>
    );
  }

  return (
    <BlocksEditor
      blocks={blocks}
      onBlocksChange={setBlocks}
      onHeaderContent={
        <div>
          {/* Breadcrumb */}
          <p className="breadcrumb mb-4">
            <Link href={adminRoutes.clients}>Clients</Link>
            <span className="mx-1">/</span>
            <Link href={adminRoutes.clientDetail(clientId)}>Client</Link>
            <span className="mx-1">/</span>
            {isNew ? 'New page' : title || 'Edit page'}
          </p>

          {error && <div className="alert-error mb-4">{error}</div>}

          {/* ── Meta fields ────────────────────────────────────── */}
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
                  onChange={e => setSlug(e.target.value)}
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">Description</label>
              <textarea
                className="field-input w-full font-mono text-sm resize-y"
                placeholder="Optional page description"
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              {pageEntry?._id && (
                <button
                  onClick={handleSetHomePage}
                  disabled={settingHomePage}
                  title="Set this page as the client's home page"
                  className="text-[11px] border px-2 py-1 font-mono transition-colors border-zinc-200 text-zinc-400 bg-white hover:text-amber-600 hover:border-amber-200"
                >
                  {settingHomePage ? '⌂ setting…' : '⌂ set as home'}
                </button>
              )}
            </div>
          </div>

          {/* ── Save button ────────────────────────────────────── */}
          <div className="flex justify-end items-center gap-4">
            <span className="text-xs font-mono text-zinc-400">
              {blocks.length} block{blocks.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`btn-primary ${saved ? 'opacity-75' : ''}`}
            >
              {saving ? 'Saving…' : saved ? 'Saved ✓' : isNew ? 'Create page' : 'Save page'}
            </button>
          </div>
        </div>
      }
      infoNote={
        <div>
          <p className="font-semibold text-blue-900 mb-1">Page Builder</p>
          <p className="text-blue-700">
            Add blocks to customize page layout. Click a block to edit its settings in the sidebar.
          </p>
        </div>
      }
    />
  );
}
