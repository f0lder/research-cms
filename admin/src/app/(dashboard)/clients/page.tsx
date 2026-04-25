'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Client } from '@research-cms/shared-types';
import { createClient, deleteClient, getAllClients } from '@/app/actions';
import { formatDateTime, adminRoutes } from '@/lib/utils';
import { ListSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui';

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
    (async () => {
      const { data, error: err } = await getAllClients();
      if (err) setError(err);
      else setClients(data ?? []);
      setLoading(false);
    })();
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

  if (loading) return (
    <div className="page">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-surface-container rounded w-48 animate-pulse" />
          <div className="h-4 bg-surface-container-low rounded w-32 animate-pulse" />
        </div>
        <div className="h-10 bg-surface-container rounded w-32 animate-pulse" />
      </div>
      <ListSkeleton items={5} />
    </div>
  );

  return (
    <div className="page">
      <h1 className="page-heading mb-1">Clients</h1>
      <p className="page-sub mb-6">
        Each client authenticates via <code className="font-mono">X-API-Key</code> and can have
        its own pages and block layouts per content type.
      </p>

      {error && <div className="alert-error mb-4">{error}</div>}

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-2 mb-8">
        <input
          type="text"
          placeholder="Client name (e.g. iOS App, Website)"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="field-input flex-1 uppercase text-xs"
        />
        <Button type="submit" disabled={creating || !newName.trim()} variant="primary" size="sm">
          {creating ? 'Creating…' : 'Create client'}
        </Button>
      </form>

      {/* Clients list */}
      {clients.length === 0 ? (
        <div className="border-2 border-dashed border-on-surface p-12 text-center">
          <p className="text-on-surface-variant text-sm">No clients yet. Create one above.</p>
        </div>
      ) : (
        <div className="border-2 border-on-surface divide-y-2 divide-on-surface">
          {clients.map(client => {
            const isRevealed = revealedId === client._id;
            const isCopied = copiedId === client._id;

            return (
              <div key={client._id} className="px-3 md:px-4 py-4 hover:bg-surface-container">
                <div className="space-y-3 md:space-y-0 md:flex md:items-center md:gap-4 md:flex-wrap">
                  {/* Name → links to detail */}
                  <div className="min-w-36">
                    <Link
                      href={adminRoutes.clientDetail(client._id!)}
                      className="text-body-md font-bold text-on-surface hover:text-primary no-underline uppercase"
                    >
                      {client.name}
                    </Link>
                    {!client.active && (
                      <span className="ml-2 text-code bg-red-100 text-red-600 px-2 py-1 font-bold uppercase">inactive</span>
                    )}
                  </div>

                  {/* Key value */}
                  <div className="flex items-center gap-2 flex-1 min-w-0 md:flex-1">
                    <code
                      className="text-code text-on-surface-variant truncate cursor-pointer hover:text-on-surface flex-1"
                      onClick={() => setRevealedId(isRevealed ? null : (client._id ?? null))}
                      title={isRevealed ? 'Click to hide' : 'Click to reveal'}
                    >
                      {isRevealed ? client.key : maskKey(client.key)}
                    </code>
                    <Button
                      onClick={() => copyKey(client)}
                      variant={isCopied ? 'secondary' : 'ghost'}
                      size="sm"
                    >
                      {isCopied ? '✓' : 'copy'}
                    </Button>
                  </div>

                  {/* Hits + last used */}
                  <div className="text-code text-on-surface-variant shrink-0">
                    <span className="text-on-surface font-bold">{client.hits.toLocaleString()}</span> hits
                    {client.lastUsedAt && <span className="ml-2 hidden md:inline">· {formatDateTime(client.lastUsedAt)}</span>}
                  </div>

                  {/* Schema access badges */}
                  {client.allowedSchemas.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {client.allowedSchemas.slice(0, 3).map(slug => (
                        <span key={slug} className="text-code bg-surface-container text-on-surface-variant px-2 py-1 font-bold uppercase">
                          {slug}
                        </span>
                      ))}
                      {client.allowedSchemas.length > 3 && (
                        <span className="text-code text-on-surface-variant">+{client.allowedSchemas.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 md:ml-auto shrink-0">
                    <Link
                      href={adminRoutes.clientDetail(client._id!)}
                    >
                      <Button variant="secondary" size="sm">
                        Configure
                      </Button>
                    </Link>
                    <Button
                      onClick={() => client._id && handleDelete(client._id, client.name)}
                      disabled={deletingId === client._id}
                      variant="destructive"
                      size="sm"
                    >
                      {deletingId === client._id ? '…' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Usage example */}
      <div className="box-info">
        <p className="font-bold text-on-surface-variant mb-2 uppercase text-code">Usage example</p>
        <pre className="font-code text-code whitespace-pre-wrap uppercase">{`curl http://localhost:3000/public/<schema-slug> \
  -H "X-API-Key: <client-key>"`}</pre>
      </div>
    </div>
  );
}
