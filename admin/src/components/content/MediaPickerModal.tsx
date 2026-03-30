'use client';
import { useState, useEffect, useRef } from 'react';
import { MediaEntry } from '@research-cms/shared-types';
import { getMediaLibrary, uploadMedia, deleteMedia } from '@/lib/utils';

interface MediaPickerModalProps {
  currentId?: string;
  onSelect: (entry: MediaEntry) => void;
  onClose: () => void;
}

export default function MediaPickerModal({ currentId, onSelect, onClose }: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<MediaEntry | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const res = await getMediaLibrary();
    setItems(res.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Pre-select currently set item
  useEffect(() => {
    if (currentId && items.length) {
      setSelected(items.find(i => i._id === currentId) ?? null);
    }
  }, [currentId, items]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const entry = await uploadMedia(file);
      await load();
      setSelected(entry);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this media file?')) return;
    await deleteMedia(id);
    if (selected?._id === id) setSelected(null);
    load();
  };

  const handleInsert = () => {
    if (selected) onSelect(selected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-[880px] max-w-[95vw] max-h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-800">Media Library</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none">✕</button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-zinc-100 bg-zinc-50">
          <label className={`btn-primary text-xs px-3 py-1.5 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? 'Uploading…' : '↑ Upload file'}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
          {error && <span className="text-xs text-red-500">{error}</span>}
          <span className="ml-auto text-xs text-zinc-400">{items.length} file{items.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-zinc-400">Loading…</p>
          ) : items.length === 0 ? (
            <div className="border-2 border-dashed border-zinc-200 rounded p-12 text-center">
              <p className="text-zinc-400 text-sm mb-3">No media files yet.</p>
              <label className="btn-primary text-xs px-3 py-1.5 cursor-pointer">
                Upload your first file
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {items.map(item => (
                <div
                  key={item._id}
                  onClick={() => setSelected(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelected(item)}
                  className={`group relative aspect-square border-2 overflow-hidden bg-zinc-100 transition-all cursor-pointer ${
                    selected?._id === item._id
                      ? 'border-blue-500'
                      : 'border-transparent hover:border-zinc-300'
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.altText || item.title}
                    className="w-full h-full object-cover"
                  />
                  {selected?._id === item._id && (
                    <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white text-[10px] w-4 h-4 flex items-center justify-center">✓</div>
                  )}
                  <button
                    onClick={e => handleDelete(e, item._id)}
                    className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                    {item.title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected detail + actions */}
        <div className="border-t border-zinc-200 px-5 py-3.5 flex items-center gap-4 bg-zinc-50">
          {selected ? (
            <>
              <img src={selected.url} alt={selected.title} className="w-12 h-12 object-cover border border-zinc-200" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 truncate">{selected.title}</p>
                {selected.caption && <p className="text-xs text-zinc-500 truncate">{selected.caption}</p>}
                {selected.fileSize && (
                  <p className="text-xs text-zinc-400">{(selected.fileSize / 1024).toFixed(1)} KB · {selected.mimeType}</p>
                )}
              </div>
              <button onClick={handleInsert} className="btn-primary text-xs px-4 py-1.5">
                Insert
              </button>
            </>
          ) : (
            <p className="text-xs text-zinc-400">Select a file to insert</p>
          )}
          <button onClick={onClose} className="btn-ghost text-xs px-3 py-1.5 ml-auto">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
