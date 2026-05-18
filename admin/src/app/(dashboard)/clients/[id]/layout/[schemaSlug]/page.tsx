'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Block, ContentTypeDefinition, blockRegistry } from '@research-cms/shared-types';
import { extractParam, adminRoutes } from '@/lib/utils';
import { getSchema, getClientLayout, updateClientLayout } from '@/app/actions';
import { useToast } from '@/contexts/ToastContext';
import { BlocksEditor } from '@/components/blocks';
import { Button, Heading, Text } from '@/components/ui';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EntryDetailLayoutPage() {
  const params = useParams();
  const clientId = extractParam(params, 'id');
  const schemaSlug = extractParam(params, 'schemaSlug');

  const { showToast } = useToast();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [schema, setSchema] = useState<ContentTypeDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [schemaRes, layoutRes] = await Promise.all([
      getSchema(schemaSlug),
      getClientLayout(clientId, schemaSlug).catch(() => ({ data: null, error: null })),
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
  }, [clientId, schemaSlug]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!schema) { showToast('Schema not found', 'error'); return; }
    if (!clientId) { showToast('Client not found', 'error'); return; }
    setSaving(true);

    const { error: err } = await updateClientLayout(clientId, schemaSlug, blocks);
    setSaving(false);
    if (err) { showToast(err, 'error'); return; }

    showToast('Layout saved', 'success');
  };

  if (loading) return <div className="page text-sm text-zinc-400">Loading…</div>;
  if (error) return <div className="page"><div className="alert-error">{error}</div></div>;

  return (
    <BlocksEditor
      blocks={blocks}
      onBlocksChange={setBlocks}
      schemaSlug={schema?.slug || schemaSlug}
      clientId={clientId}
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
              <Heading level={1} className="page-heading">{schema?.name} Entry Layout</Heading>
              <p className="page-sub font-mono text-sm">
                {blocks.length} block{blocks.length !== 1 ? 's' : ''} · drag to reorder
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving…' : 'Save layout'}
            </Button>
          </div>
        </div>
      }
      infoNote={
        <div>
          <Text variant='body-lg' >Entry Layout Template</Text>
          <Text>
            Add field blocks and archives to customize how entries from this schema are displayed.
            Click a block to configure it in the sidebar.
          </Text>
        </div>
      }
    />
  );
}
