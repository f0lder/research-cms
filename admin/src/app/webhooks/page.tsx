'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import { getAllWebhooks, deleteWebhook, updateWebhook, type Webhook } from '@/app/actions';

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await getAllWebhooks();
    if (err) setError(err);
    else setWebhooks(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (webhook: Webhook) => {
    const { error: err } = await updateWebhook(webhook._id!, { active: !webhook.active });
    if (err) { setError(err); return; }
    setWebhooks(prev => prev.map(w => w._id === webhook._id ? { ...w, active: !w.active } : w));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook?')) return;
    const { error: err } = await deleteWebhook(id);
    if (err) { setError(err); return; }
    setWebhooks(prev => prev.filter(w => w._id !== id));
  };

  if (loading) return <div className="p-8 text-sm text-zinc-400 font-mono">Loading…</div>;

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold font-mono mb-1">Webhooks</h1>
          <p className="text-xs text-zinc-400">HTTP callbacks triggered on CMS events.</p>
        </div>
        <Link href="/webhooks/new" className="btn-primary text-xs px-3 py-1.5 no-underline">
          + New webhook
        </Link>
      </div>

      {error && <div className="alert-error mb-4 text-xs">{error}</div>}

      {webhooks.length === 0 ? (
        <p className="text-sm text-zinc-400 font-mono">No webhooks yet.</p>
      ) : (
        <div className="divide-y divide-zinc-100 border border-zinc-200">
          {webhooks.map(webhook => (
            <div key={webhook._id} className="p-4 flex items-start gap-4">
              {/* Active toggle */}
              <button
                onClick={() => handleToggle(webhook)}
                title={webhook.active ? 'Click to disable' : 'Click to enable'}
                className={`mt-0.5 w-3 h-3 rounded-full border flex-shrink-0 cursor-pointer ${
                  webhook.active ? 'bg-emerald-400 border-emerald-400' : 'bg-transparent border-zinc-400'
                }`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold font-mono">{webhook.name}</span>
                  {!webhook.active && (
                    <span className="text-[10px] text-zinc-400 border border-zinc-300 px-1.5 py-0.5 rounded">disabled</span>
                  )}
                </div>

                <div className="text-xs text-zinc-400 font-mono truncate mb-2">{webhook.url}</div>

                {/* Event badges */}
                {webhook.events.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {webhook.events.map(e => (
                      <span key={e} className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">{e}</span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-400 mb-2">All events</div>
                )}

                <div className="flex items-center gap-4 text-[10px] text-zinc-400 font-mono">
                  <span className="text-emerald-600">{webhook.successCount} ok</span>
                  {webhook.failureCount > 0 && (
                    <span className="text-red-500">{webhook.failureCount} failed</span>
                  )}
                  {webhook.lastTriggeredAt && (
                    <span>last: {formatDateTime(webhook.lastTriggeredAt)}</span>
                  )}
                  {webhook.lastError && (
                    <span className="text-red-400 truncate max-w-xs">{webhook.lastError}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/webhooks/${webhook._id}`}
                  className="text-xs text-zinc-500 hover:text-zinc-800 font-mono no-underline"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(webhook._id!)}
                  className="text-xs text-red-400 hover:text-red-600 font-mono bg-transparent border-0 cursor-pointer p-0"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
