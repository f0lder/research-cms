'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Block, ContentTypeDefinition, blockRegistry, registerBuiltInBlocks } from '@research-cms/shared-types';
import { extractParam, adminRoutes } from '@/lib/utils';
import { getSchema, getLayout, updateClientLayout } from '@/app/actions';
import { BlocksEditor } from '@/components/blocks';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EntryDetailLayoutPage() {
  const params = useParams();
  const clientId = extractParam(params, 'id');
  const schemaSlug = extractParam(params, 'slug');

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [schema, setSchema] = useState<ContentTypeDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Initialize block registry
  useEffect(() => {
    registerBuiltInBlocks();
  }, []);

  const load = useCallback(async () => {
    const [schemaRes, layoutRes] = await Promise.all([
      getSchema(schemaSlug),
      getLayout(schemaSlug).catch(() => ({ data: null, error: null })),
    ]);

    if (schemaRes.error) {
      setError(schemaRes.error ?? 'Failed to load');
      setLoading(false);
      return;
    }

    if (!schemaRes.data) {
      setError('Schema not found');
      setLoading(false);
      return;
    }

    setSchema(schemaRes.data);

    // Load existing layout blocks if they exist
    const existingLayout = layoutRes.data;
    const loadedBlocks: Block[] = (existingLayout?.blocks ?? [])
      .map(b => ({
        ...b,
        id: b.id || uuidv4(),
        visible: b.visible !== false,
        order: b.order ?? 0,
      } as Block))

    setBlocks(loadedBlocks);
    setLoading(false);
  }, [schemaSlug]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!schema) { setError('Schema not found'); return; }
    if (!clientId) { setError('Client not found'); return; }
    setSaving(true);
    setSaved(false);
    setError('');

    const { error: err } = await updateClientLayout(clientId, schemaSlug, blocks);
    setSaving(false);
    if (err) { setError(err); return; }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="page text-sm text-zinc-400">Loading…</div>;
  if (error) return <div className="page"><div className="alert-error">{error}</div></div>;

  return (
    <BlocksEditor
      blocks={blocks}
      onBlocksChange={setBlocks}
      schemaSlug={schemaSlug}
      onHeaderContent={
        <div>
          {/* Breadcrumb */}
          <p className="breadcrumb mb-4 font-mono text-sm">
            <Link href={adminRoutes.clients}>Clients</Link>
            <span className="mx-1">/</span>
            <Link href={adminRoutes.clientDetail(clientId)}>Client</Link>
            <span className="mx-1">/</span>
            {schema?.name}
            <span className="mx-1">/</span>
            Entry Layout
          </p>

          {/* Header */}
          <div className="flex items-start justify-between">
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
        </div>
      }
      infoNote={
        <div>
          <p className="font-semibold text-blue-900 mb-1">Entry Layout Template</p>
          <p className="text-blue-700">
            Add field blocks and archives to customize how entries from this schema are displayed.
            Click a block to configure it in the sidebar.
          </p>
        </div>
      }
    />
  );
}
