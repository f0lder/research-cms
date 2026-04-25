'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Webhook } from '@research-cms/shared-types';
import { extractParam } from '@/lib/utils';
import { getWebhook, createWebhook, updateWebhook } from '@/app/actions';

const ALL_EVENTS = [
  'content.created',
  'content.updated',
  'content.deleted',
  'schema.created',
  'schema.updated',
  'schema.deleted',
  'media.uploaded',
  'media.deleted',
];

const IS_NEW = 'new';

export default function WebhookEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = extractParam(params as Record<string, string | string[]>, 'id');
  const isNew = id === IS_NEW;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [schemasFilter, setSchemasFilter] = useState('');
  const [active, setActive] = useState(true);
  const [secret, setSecret] = useState('');

  useEffect(() => {
    if (isNew) return;
    getWebhook(id).then(({ data, error: err }) => {
      if (err || !data) { setError(err ?? 'Not found'); setLoading(false); return; }
      setName(data.name);
      setUrl(data.url);
      setSelectedEvents(data.events ?? []);
      setSchemasFilter((data.schemas ?? []).join(', '));
      setActive(data.active);
      setSecret(data.secret ?? '');
      setLoading(false);
    });
  }, [id, isNew]);

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!url.trim())  { setError('URL is required.'); return; }
    try { new URL(url.trim()); } catch { setError('URL must be a valid URL.'); return; }

    setSaving(true);
    setError('');

    const schemas = schemasFilter
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      url: url.trim(),
      events: selectedEvents,
      schemas,
      active,
      secret: secret.trim() || null,
    };

    if (isNew) {
      const { data, error: err } = await createWebhook(payload);
      setSaving(false);
      if (err) { setError(err); return; }
      router.replace(`/webhooks/${data!._id}`);
    } else {
      const { error: err } = await updateWebhook(id, payload);
      setSaving(false);
      if (err) { setError(err); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (loading) return <div className="page text-sm text-zinc-400">Loading…</div>;

  return (
    <div className="page">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/webhooks')}
          className="text-xs text-zinc-400 hover:text-zinc-700 font-mono bg-transparent border-0 cursor-pointer p-0"
        >
          ← Webhooks
        </button>
        <span className="text-zinc-300">/</span>
        <h1 className="text-lg font-bold font-mono">{isNew ? 'New webhook' : name || 'Edit webhook'}</h1>
      </div>

      {error && <div className="alert-error mb-4 text-xs">{error}</div>}

      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Name</label>
          <input
            className="input w-full"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="My webhook"
          />
        </div>

        {/* URL */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">URL</label>
          <input
            className="input w-full font-mono text-sm"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/webhook"
          />
        </div>

        {/* Events */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Events <span className="font-normal normal-case text-zinc-400">(empty = all)</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_EVENTS.map(event => (
              <label key={event} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedEvents.includes(event)}
                  onChange={() => toggleEvent(event)}
                  className="accent-zinc-800"
                />
                <span className="text-xs font-mono text-zinc-600 group-hover:text-zinc-800">{event}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Schema filter */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Schema filter <span className="font-normal normal-case text-zinc-400">(slugs, comma-separated — empty = all)</span>
          </label>
          <input
            className="input w-full font-mono text-sm"
            value={schemasFilter}
            onChange={e => setSchemasFilter(e.target.value)}
            placeholder="articles, products"
          />
        </div>

        {/* Secret */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Secret <span className="font-normal normal-case text-zinc-400">(optional — used for HMAC x-cms-signature header)</span>
          </label>
          <input
            className="input w-full font-mono text-sm"
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Leave blank for unsigned requests"
          />
        </div>

        {/* Active */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={e => setActive(e.target.checked)}
            className="accent-zinc-800"
          />
          <span className="text-sm text-zinc-700">Active</span>
        </label>

        {/* Save */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-sm px-4 py-2"
          >
            {saving ? 'Saving…' : isNew ? 'Create webhook' : 'Save changes'}
          </button>
          {saved && <span className="text-xs text-emerald-600 font-mono">Saved ✓</span>}
        </div>
      </div>
    </div>
  );
}
