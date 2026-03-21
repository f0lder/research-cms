'use client';
import { useState, useEffect } from 'react';
import Select from 'react-select';
import { ApiKey, ContentTypeDefinition } from '@research-cms/shared-types';
import { getAllApiKeys, createApiKey, deleteApiKey, updateApiKeySchemas, getAllSchemas, formatDateTime } from '@/lib/utils';

type Option = { value: string; label: string };

function toOptions(schemas: ContentTypeDefinition[]): Option[] {
  return schemas.map(s => ({ value: s.slug, label: s.name }));
}

function SchemaPicker({
  allSchemas,
  selected,
  onChange,
}: {
  allSchemas: ContentTypeDefinition[];
  selected: string[];
  onChange: (slugs: string[]) => void;
}) {
  const options = toOptions(allSchemas);
  const value = options.filter(o => selected.includes(o.value));

  return (
    <Select<Option, true>
      isMulti
      options={options}
      value={value}
      onChange={opts => onChange(opts.map(o => o.value))}
      placeholder="All schemas (unrestricted)"
      noOptionsMessage={() => 'No schemas found'}
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
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [schemas, setSchemas] = useState<ContentTypeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  // Track pending schema changes per key id before saving
  const [pendingSchemas, setPendingSchemas] = useState<Record<string, string[]>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAllApiKeys(), getAllSchemas()]).then(([keysRes, schemasRes]) => {
      if (keysRes.error) setError(keysRes.error);
      else setKeys(keysRes.data ?? []);
      setSchemas(schemasRes.data ?? []);
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

  const handleSaveSchemas = async (id: string) => {
    const slugs = pendingSchemas[id] ?? keys.find(k => k._id === id)?.allowedSchemas ?? [];
    setSavingId(id);
    const { data, error: err } = await updateApiKeySchemas(id, slugs);
    setSavingId(null);
    if (err) { setError(err); return; }
    if (data) {
      setKeys(prev => prev.map(k => k._id === id ? data : k));
      setPendingSchemas(prev => { const next = { ...prev }; delete next[id]; return next; });
    }
  };

  const getSchemas = (key: ApiKey) =>
    pendingSchemas[key._id!] ?? key.allowedSchemas ?? [];

  const isDirty = (key: ApiKey) =>
    key._id! in pendingSchemas;

  const copyKey = async (key: ApiKey) => {
    try {
      await navigator.clipboard.writeText(key.key);
      setCopiedId(key._id ?? null);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
  };

  const maskKey = (key: string) => `${key.slice(0, 12)}${'·'.repeat(16)}${key.slice(-4)}`;

  if (loading) return <div className="p-8 font-mono text-sm text-zinc-400">Loading…</div>;

  return (
    <div className="p-8 font-mono max-w-4xl">
      <h1 className="page-heading mb-1">API Keys</h1>
      <p className="page-sub mb-6">
        Authenticate public API requests via <code className="font-mono">X-API-Key</code>.
        Restrict each key to specific content types or leave open for all.
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
        <div className="border border-zinc-200 divide-y divide-zinc-100">
          {keys.map(key => {
            const isRevealed = revealedId === key._id;
            const isCopied = copiedId === key._id;
            const currentSchemas = getSchemas(key);
            const dirty = isDirty(key);

            return (
              <div key={key._id} className="px-4 py-4 hover:bg-zinc-50">
                {/* Row 1: name / key / stats / delete */}
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Name */}
                  <div className="min-w-30">
                    <span className="text-sm font-medium text-zinc-800">{key.name}</span>
                    {!key.active && (
                      <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 font-mono">inactive</span>
                    )}
                  </div>

                  {/* Key value */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
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
                    >
                      {isCopied ? '✓' : 'copy'}
                    </button>
                  </div>

                  {/* Hits + last used */}
                  <div className="text-xs text-zinc-400 font-mono shrink-0">
                    <span className="text-zinc-600 font-semibold">{key.hits.toLocaleString()}</span> hits
                    {key.lastUsedAt && <span className="ml-2">· {formatDateTime(key.lastUsedAt)}</span>}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => key._id && handleDelete(key._id)}
                    disabled={deletingId === key._id}
                    className="btn-danger text-xs px-3 py-1 shrink-0"
                  >
                    {deletingId === key._id ? '…' : 'Delete'}
                  </button>
                </div>

                {/* Row 2: schema access */}
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold shrink-0">
                    Access
                  </span>
                  <SchemaPicker
                    allSchemas={schemas}
                    selected={currentSchemas}
                    onChange={slugs => setPendingSchemas(prev => ({ ...prev, [key._id!]: slugs }))}
                  />
                  {dirty && (
                    <button
                      onClick={() => key._id && handleSaveSchemas(key._id)}
                      disabled={savingId === key._id}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      {savingId === key._id ? 'Saving…' : 'Save'}
                    </button>
                  )}
                  {currentSchemas.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {currentSchemas.map(slug => (
                        <span key={slug} className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 font-mono">
                          {slug}
                        </span>
                      ))}
                    </div>
                  )}
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
  -H "X-API-Key: <your-key>"`}</pre>
      </div>
    </div>
  );
}
