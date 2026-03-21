'use client';
import { useState, useEffect } from 'react';
import { ApiKey } from '@research-cms/shared-types';
import { getAllApiKeys, createApiKey, deleteApiKey, formatDateTime } from '@/lib/utils';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);

  useEffect(() => {
    getAllApiKeys().then(({ data, error: err }) => {
      if (err) setError(err);
      else setKeys(data ?? []);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const { data, error: err } = await createApiKey(newName.trim());
    setCreating(false);
    if (err) { setError(err); return; }
    if (data) {
      setKeys(prev => [data, ...prev]);
      setNewName('');
      // Auto-reveal the new key so user can copy it
      setRevealedId(data._id ?? null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this API key? Any apps using it will lose access immediately.')) return;
    setDeletingId(id);
    const { error: err } = await deleteApiKey(id);
    if (err) { setError(err); setDeletingId(null); return; }
    setKeys(prev => prev.filter(k => k._id !== id));
    setDeletingId(null);
  };

  const copyKey = async (key: ApiKey) => {
    try {
      await navigator.clipboard.writeText(key.key);
      setCopiedId(key._id ?? null);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback: select the text
    }
  };

  const maskKey = (key: string) => `${key.slice(0, 12)}${'·'.repeat(20)}${key.slice(-4)}`;

  if (loading) return <div className="p-8 font-mono text-sm text-zinc-400">Loading…</div>;

  return (
    <div className="p-8 font-mono max-w-3xl">
      <h1 className="page-heading mb-1">API Keys</h1>
      <p className="page-sub mb-6">
        Keys are used to authenticate requests to the public content API.
        Include the key in the <code className="font-mono">X-API-Key</code> request header.
      </p>

      {error && <div className="alert-error mb-4">{error}</div>}

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="Key name (e.g. iOS App, Website)"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="field-input flex-1"
        />
        <button type="submit" disabled={creating || !newName.trim()} className="btn-primary">
          {creating ? 'Creating…' : 'Generate key'}
        </button>
      </form>

      {/* Keys list */}
      {keys.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No API keys yet. Generate one above.</p>
        </div>
      ) : (
        <div className="border border-zinc-200">
          {/* Header */}
          <div className="grid grid-cols-[1fr_2fr_80px_120px_80px] gap-4 px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            <span>Name</span>
            <span>Key</span>
            <span className="text-center">Hits</span>
            <span>Last used</span>
            <span></span>
          </div>

          {keys.map(key => {
            const isRevealed = revealedId === key._id;
            const isCopied = copiedId === key._id;
            return (
              <div
                key={key._id}
                className="grid grid-cols-[1fr_2fr_80px_120px_80px] gap-4 items-center px-4 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
              >
                {/* Name */}
                <div>
                  <span className="text-sm text-zinc-800">{key.name}</span>
                  {!key.active && (
                    <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 font-mono">inactive</span>
                  )}
                </div>

                {/* Key value */}
                <div className="flex items-center gap-2 min-w-0">
                  <code
                    className="text-[11px] font-mono text-zinc-500 truncate cursor-pointer hover:text-zinc-700"
                    onClick={() => setRevealedId(isRevealed ? null : (key._id ?? null))}
                    title={isRevealed ? 'Click to hide' : 'Click to reveal'}
                  >
                    {isRevealed ? key.key : maskKey(key.key)}
                  </code>
                  <button
                    onClick={() => copyKey(key)}
                    className="shrink-0 text-[10px] text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-2 py-0.5 bg-white hover:border-zinc-400 transition-colors font-mono"
                    title="Copy to clipboard"
                  >
                    {isCopied ? '✓' : 'copy'}
                  </button>
                </div>

                {/* Hits */}
                <div className="text-center font-mono text-sm text-zinc-600">
                  {key.hits.toLocaleString()}
                </div>

                {/* Last used */}
                <div className="text-xs text-zinc-400">
                  {key.lastUsedAt ? formatDateTime(key.lastUsedAt) : 'Never'}
                </div>

                {/* Delete */}
                <div className="flex justify-end">
                  <button
                    onClick={() => key._id && handleDelete(key._id)}
                    disabled={deletingId === key._id}
                    className="btn-danger text-xs px-3 py-1"
                  >
                    {deletingId === key._id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Usage example */}
      <div className="mt-8 p-4 border border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
        <p className="font-semibold text-zinc-600 mb-2">Usage example</p>
        <pre className="font-mono text-[11px] whitespace-pre-wrap">{`curl https://your-api.com/public/<schema-slug> \\
  -H "X-API-Key: <your-key>"`}</pre>
      </div>
    </div>
  );
}
