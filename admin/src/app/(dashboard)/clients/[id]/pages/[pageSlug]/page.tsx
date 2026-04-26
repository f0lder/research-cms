'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Block, blockRegistry, PAGE_SCHEMA_SLUG, ContentEntry } from '@research-cms/shared-types';
import { extractParam, adminRoutes } from '@/lib/utils';
import { createEntry, updateEntry, getEntry, getPageBySlug, bulkUpdateStatus } from '@/app/actions';
import { BlocksEditor } from '@/components/blocks';
import { Button, Container, TextField, Text } from '@/components/ui';


const IS_NEW = '_new';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PageEditorPage() {
  const params = useParams();
  const clientId = extractParam(params, 'id');
  const pageSlug = extractParam(params, 'pageSlug');
  const isNew = pageSlug === IS_NEW;

  const [pageEntry, setPageEntry] = useState<ContentEntry | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugIsManual, setSlugIsManual] = useState(false);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (isNew) {
      setLoading(false);
      return;
    }

    // Load the page entry by slug
    const { data: entryData, error: entryErr } = await getPageBySlug(clientId, pageSlug);
    if (entryErr) { setError(entryErr); setLoading(false); return; }

    if (entryData) {
      // Populate form fields from entry data
      setPageEntry(entryData as ContentEntry);
      setTitle((entryData.data?.title as string) ?? '');
      setSlug((entryData.data?.slug as string) ?? '');
      setSlugIsManual(true);
      setDescription((entryData.data?.description as string) ?? '');
      setStatus((entryData.status as 'draft' | 'published') ?? 'draft');

      // Load blocks from page entry data
      const blocksData = entryData.data?.blocks;
      if (blocksData) {
        // Blocks are now stored as Block[] directly, not JSON
        const blocksList = (Array.isArray(blocksData) ? blocksData : []) as Block[];
        setBlocks(blocksList.filter((b): b is Block => b.type !== 'field'));
      }
    }

    setLoading(false);
  }, [clientId, pageSlug, isNew]);

  useEffect(() => { load(); }, [load]);

  // Auto-generate slug from title on new pages (unless user manually edited it)
  useEffect(() => {
    if (isNew && title && !slugIsManual) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  }, [title, isNew, slugIsManual]);

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) { setError('Title and slug are required.'); return; }

    // Check for duplicate slugs on new pages
    if (isNew) {
      const { data: existingPage } = await getPageBySlug(clientId, slug.trim());
      if (existingPage) {
        setError('A page with this slug already exists for this client.');
        setSaving(false);
        return;
      }
    }

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

      // Set status if published
      if (status === 'published') {
        const { error: statusErr } = await bulkUpdateStatus(PAGE_SCHEMA_SLUG, [entry._id], 'published');
        if (statusErr) { setSaving(false); setError(statusErr); return; }
      }

      setPageEntry(entry);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Redirect to edit URL using the slug
      const newSlug = (entry.data?.slug as string) ?? slug.trim();
      window.history.replaceState(null, '', `/clients/${clientId}/pages/${newSlug}`);
    } else if (pageEntry?._id) {
      // Update page entry with status
      const { error: entryErr } = await updateEntry(PAGE_SCHEMA_SLUG, pageEntry._id, entryData);
      if (entryErr) { setSaving(false); setError(entryErr); return; }

      // Update status
      const { error: statusErr } = await bulkUpdateStatus(PAGE_SCHEMA_SLUG, [pageEntry._id], status);
      if (statusErr) { setSaving(false); setError(statusErr); return; }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Container size="lg" padding="lg">
        <Text variant="body-sm" color="secondary">Loading…</Text>
      </Container>
    );
  }

  if (error && !pageEntry && !isNew) {
    return (
      <Container size="lg" padding="lg">
        <div className="border-2 border-error bg-surface px-4 py-3">
          <Text variant="body-sm" color="error">{error}</Text>
        </div>
      </Container>
    );
  }

  return (
    <BlocksEditor
      blocks={blocks}
      onBlocksChange={setBlocks}
      onHeaderContent={
        <div>
          {/* Breadcrumb */}
          <Text variant="caption" color="secondary" className="mb-4 uppercase tracking-widest font-bold">
            <Link href={adminRoutes.clients} className="hover:text-on-surface">Clients</Link>
            <span className="mx-1">/</span>
            <Link href={adminRoutes.clientDetail(clientId)} className="hover:text-on-surface">Client</Link>
            <span className="mx-1">/</span>
            {isNew ? 'New page' : title || 'Edit page'}
          </Text>

          {error && (
            <div className="mb-4 border-2 border-error bg-surface px-4 py-3">
              <Text variant="body-sm" color="error">{error}</Text>
            </div>
          )}

          {/* ── Meta fields ────────────────────────────────────── */}
          <div className="border-2 border-on-surface bg-surface p-4 mb-6">
            <div className="flex gap-4 mb-4 flex-wrap">
              <div className="flex-1 min-w-48">
                <TextField
                  label="Title"
                  placeholder="Page title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-36">
                <TextField
                  label="Slug"
                  placeholder="page-slug"
                  value={slug}
                  onChange={e => {
                    setSlug(e.target.value);
                    setSlugIsManual(true);
                  }}
                />
              </div>
            </div>
            <div className="mb-4 flex flex-col gap-2">
              <label className="font-label uppercase text-label text-on-surface">Description</label>
              <textarea
                className="w-full border-2 border-on-surface bg-surface px-4 py-2 font-code text-code text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
                placeholder="Optional page description"
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-4 mb-4">
              <div className="flex flex-col gap-2">
                <label className="font-label uppercase text-label text-on-surface">Status</label>
                <select
                  className="border-2 border-on-surface bg-surface px-4 py-2 font-code text-code text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={status}
                  onChange={e => setStatus(e.target.value as 'draft' | 'published')}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Save button ────────────────────────────────────── */}
          <div className="flex justify-end items-center gap-4">
            <Text variant="code" color="secondary" as="span">
              {blocks.length} block{blocks.length !== 1 ? 's' : ''}
            </Text>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="primary"
              size="md"
              className={saved ? 'opacity-75' : ''}
            >
              {saving ? 'Saving…' : saved ? 'Saved ✓' : isNew ? 'Create page' : 'Save page'}
            </Button>
          </div>
        </div>
      }
      infoNote={
        <div>
          <Text variant="body-sm" className="font-bold uppercase mb-1">Page Builder</Text>
          <Text variant="body-sm" color="secondary">
            Add blocks to customize page layout. Click a block to edit its settings in the sidebar.
          </Text>
        </div>
      }
    />
  );
}
