'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Client } from '@research-cms/shared-types';
import { getAllClients, createClient, deleteClient, formatDateTime, adminRoutes } from '@/lib/utils';

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);

  useEffect(() => {
    getAllClients().then(({ data, error: err }) => {
      if (err) setError(err);
      else setClients(data ?? []);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const { data, error: err } = await createClient(newName.trim());
    setCreating(false);
    if (err) { setError(err); return; }
    if (data) {
      setClients(prev => [data, ...prev]);
      setNewName('');
      setRevealedId(data._id ?? null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete client "${name}"? Any apps using its key will lose access immediately.`)) return;
    setDeletingId(id);
    const { error: err } = await deleteClient(id);
    if (err) { setError(err); setDeletingId(null); return; }
    setClients(prev => prev.filter(c => c._id !== id));
    setDeletingId(null);
  };

  const copyKey = async (client: Client) => {
    try {
      await navigator.clipboard.writeText(client.key);
      setCopiedId(client._id ?? null);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
  };

  const maskKey = (key: string) => `${key.slice(0, 12)}${'·'.repeat(16)}${key.slice(-4)}`;

  if (loading) return <div className="p-8 font-mono text-sm text-zinc-400">Loading…</div>;

  return (
    <div className="p-8 font-mono max-w-4xl">
      <h1 className="page-heading mb-1">Clients</h1>
      <p className="page-sub mb-6">
        Each client authenticates via <code className="font-mono">X-API-Key</code> and can have
        its own block layout per content type — overriding the global design.
      </p>

      {error && <div className="alert-error mb-4">{error}</div>}

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="Client name (e.g. iOS App, Website)"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="field-input flex-1"
        />
        <button type="submit" disabled={creating || !newName.trim()} className="btn-primary">
          {creating ? 'Creating…' : 'Create client'}
        </button>
      </form>

      {/* Clients list */}
      {clients.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 text-sm">No clients yet. Create one above.</p>
        </div>
      ) : (
        <div className="border border-zinc-200 divide-y divide-zinc-100">
          {clients.map(client => {
            const isRevealed = revealedId === client._id;
            const isCopied = copiedId === client._id;

            return (
              <div key={client._id} className="px-4 py-4 hover:bg-zinc-50">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Name → links to detail */}
                  <div className="min-w-36">
                    <Link
                      href={adminRoutes.clientDetail(client._id!)}
                      className="text-sm font-medium text-zinc-800 hover:text-zinc-500 no-underline"
                    >
                      {client.name}
                    </Link>
                    {!client.active && (
                      <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 font-mono">inactive</span>
                    )}
                  </div>

                  {/* Key value */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <code
                      className="text-[11px] font-mono text-zinc-500 truncate cursor-pointer hover:text-zinc-700"
                      onClick={() => setRevealedId(isRevealed ? null : (client._id ?? null))}
                      title={isRevealed ? 'Click to hide' : 'Click to reveal'}
                    >
                      {isRevealed ? client.key : maskKey(client.key)}
                    </code>
                    <button
                      onClick={() => copyKey(client)}
                      className="shrink-0 text-[10px] text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-2 py-0.5 bg-white hover:border-zinc-400 transition-colors font-mono"
                    >
                      {isCopied ? '✓' : 'copy'}
                    </button>
                  </div>

                  {/* Hits + last used */}
                  <div className="text-xs text-zinc-400 font-mono shrink-0">
                    <span className="text-zinc-600 font-semibold">{client.hits.toLocaleString()}</span> hits
                    {client.lastUsedAt && <span className="ml-2">· {formatDateTime(client.lastUsedAt)}</span>}
                  </div>

                  {/* Schema access badges */}
                  {client.allowedSchemas.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {client.allowedSchemas.map(slug => (
                        <span key={slug} className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 font-mono">
                          {slug}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Custom layouts badge */}
                  {client.layouts.length > 0 && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 font-mono">
                      {client.layouts.length} custom layout{client.layouts.length !== 1 ? 's' : ''}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-auto shrink-0">
                    <Link
                      href={adminRoutes.clientDetail(client._id!)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-2 py-1 bg-white hover:border-zinc-400 transition-colors font-mono no-underline"
                    >
                      Configure
                    </Link>
                    <button
                      onClick={() => client._id && handleDelete(client._id, client.name)}
                      disabled={deletingId === client._id}
                      className="btn-danger text-xs px-3 py-1"
                    >
                      {deletingId === client._id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Usage example */}
      <div className="mt-8 p-4 border border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
        <p className="font-semibold text-zinc-600 mb-2">Usage example</p>
        <pre className="font-mono text-[11px] whitespace-pre-wrap">{`curl http://localhost:3000/public/<schema-slug> \\
  -H "X-API-Key: <client-key>"`}</pre>
      </div>
    </div>
  );
}
