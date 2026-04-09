'use client';
import { useState, useEffect } from 'react';
import { MediaEntry } from '@research-cms/shared-types';
import { uploadMedia, formatDateTime } from '@/lib/utils';
import { getMediaLibrary, updateMedia, deleteMedia } from '@/app/actions';
import { MediaGridSkeleton } from '@/components/skeletons';

export default function MediaPage() {
  const [items, setItems] = useState<MediaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<MediaEntry | null>(null);
  const [editDraft, setEditDraft] = useState<{ title: string; caption: string; altText: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await getMediaLibrary();
    if (res.error) setError(res.error);
    else setItems(res.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const res = await getMediaLibrary();
      if (res.error) setError(res.error);
      else setItems(res.data ?? []);
      setLoading(false);
    })();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      await Promise.all(files.map(f => uploadMedia(f)));
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSelect = (item: MediaEntry) => {
    setSelected(item);
    setEditDraft({ title: item.title, caption: item.caption ?? '', altText: item.altText ?? '' });
  };

  const handleSave = async () => {
    if (!selected || !editDraft) return;
    setSaving(true);
    const res = await updateMedia(selected._id, editDraft);
    if (res.data) {
      const updated = res.data;
      setItems(prev => prev.map(i => i._id === selected._id ? updated : i));
      setSelected(updated);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file permanently?')) return;
    await deleteMedia(id);
    if (selected?._id === id) { setSelected(null); setEditDraft(null); }
    load();
  };

  return (
    <div className="flex h-full">
      {/* Main grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-200">
          <h1 className="page-heading">Media Library</h1>
          <label className={`btn-primary text-xs px-3 py-1.5 cursor-pointer ml-4 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? 'Uploading…' : '↑ Upload files'}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          </label>
          {error && <span className="text-xs text-red-500">{error}</span>}
          <span className="ml-auto text-xs text-zinc-400">{items.length} file{items.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <MediaGridSkeleton />
          ) : items.length === 0 ? (
            <div className="border-2 border-dashed border-zinc-200 p-16 text-center">
              <p className="text-zinc-400 mb-4">No media files yet.</p>
              <label className="btn-primary text-sm px-4 py-2 cursor-pointer">
                Upload your first file
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-3">
              {items.map(item => (
                <button
                  key={item._id}
                  onClick={() => handleSelect(item)}
                  className={`group relative aspect-square border-2 overflow-hidden bg-zinc-100 transition-all ${
                    selected?._id === item._id ? 'border-blue-500' : 'border-transparent hover:border-zinc-300'
                  }`}
                >
                  <img src={item.url} alt={item.altText || item.title} className="w-full h-full object-cover" />
                  {selected?._id === item._id && (
                    <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white text-[10px] w-4 h-4 flex items-center justify-center">✓</div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                    {item.title}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && editDraft && (
        <div className="w-72 border-l border-zinc-200 flex flex-col bg-white">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Details</span>
            <button onClick={() => { setSelected(null); setEditDraft(null); }} className="text-zinc-400 hover:text-zinc-600 text-sm">✕</button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <img
              src={selected.url}
              alt={selected.altText || selected.title}
              className="w-full aspect-square object-contain border border-zinc-100 bg-zinc-50"
            />

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">Title</label>
              <input
                className="field-input w-full"
                value={editDraft.title}
                onChange={e => setEditDraft(d => d ? { ...d, title: e.target.value } : d)}
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">Caption</label>
              <textarea
                className="field-input w-full resize-none"
                rows={2}
                value={editDraft.caption}
                onChange={e => setEditDraft(d => d ? { ...d, caption: e.target.value } : d)}
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 mb-1 block">Alt Text</label>
              <input
                className="field-input w-full"
                value={editDraft.altText}
                onChange={e => setEditDraft(d => d ? { ...d, altText: e.target.value } : d)}
              />
            </div>

            <div className="space-y-1.5 pt-1 border-t border-zinc-100">
              <p className="text-[10px] font-mono text-zinc-400 break-all">{selected.url.split('/').pop()}</p>
              {selected.mimeType && <p className="text-[10px] font-mono text-zinc-400">{selected.mimeType}{selected.fileSize ? ` · ${(selected.fileSize / 1024).toFixed(1)} KB` : ''}</p>}
              {selected.createdAt && <p className="text-[10px] font-mono text-zinc-400">{formatDateTime(selected.createdAt)}</p>}
            </div>
          </div>

          <div className="p-4 border-t border-zinc-100 flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-xs py-1.5 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => handleDelete(selected._id)} className="btn-danger text-xs px-3 py-1.5">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
