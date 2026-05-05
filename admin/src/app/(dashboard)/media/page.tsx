'use client';
import { useState, useEffect } from 'react';
import { MediaEntry } from '@research-cms/shared-types';
import { uploadMedia, formatDateTime } from '@/lib/utils';
import { getMediaLibrary, updateMedia, deleteMedia } from '@/app/actions';
import { MediaGridSkeleton } from '@/components/skeletons';
import { Button, TextField, Heading, Text } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';

export default function MediaPage() {
  const { showToast } = useToast();
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
      showToast(`${files.length} file${files.length !== 1 ? 's' : ''} uploaded successfully`, 'success');
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      showToast(errorMsg, 'error');
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
      showToast('Media updated successfully', 'success');
    } else if (res.error) {
      showToast(res.error, 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file permanently?')) return;
    const res = await deleteMedia(id);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('File deleted successfully', 'success');
      if (selected?._id === id) { setSelected(null); setEditDraft(null); }
      load();
    }
  };

  return (
    <div className="flex h-full">
      {/* Main grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b-2 border-on-surface">
          <Heading level={1}>Media Library</Heading>
          <label className={`cursor-pointer ml-4 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <Button as="span" variant="primary" size="sm">
              {uploading ? 'Uploading…' : '↑ Upload files'}
            </Button>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          </label>
          {error && <Text variant="code" color="error">{error}</Text>}
          <Text variant="caption" color="secondary" className="ml-auto">{items.length} file{items.length !== 1 ? 's' : ''}</Text>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <MediaGridSkeleton />
          ) : items.length === 0 ? (
            <div className="border-2 border-dashed border-on-surface p-16 text-center">
              <Text variant="caption" color="secondary" className="mb-4 block">No media files yet.</Text>
              <label className="inline-block">
                <Button as="span" variant="primary" size="md">
                  Upload your first file
                </Button>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-3">
              {items.map(item => (
                <button
                  key={item._id}
                  onClick={() => handleSelect(item)}
                  className={`group relative aspect-square border-2 overflow-hidden bg-surface-container transition-all ${
                    selected?._id === item._id ? 'border-primary' : 'border-on-surface hover:border-on-surface'
                  }`}
                >
                  <img src={item.url} alt={item.altText || item.title} className="w-full h-full object-cover" />
                  {selected?._id === item._id && (
                    <div className="absolute top-1.5 right-1.5 bg-primary text-on-primary text-code w-4 h-4 flex items-center justify-center font-bold">✓</div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-code px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
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
        <div className="w-72 border-l-2 border-on-surface flex flex-col bg-surface">
          <div className="p-4 border-b-2 border-on-surface flex items-center justify-between">
            <Text variant="label" color="secondary" className="uppercase">Details</Text>
            <Button
              onClick={() => { setSelected(null); setEditDraft(null); }}
              variant="ghost"
              size="sm"
              className="text-on-surface hover:text-primary"
            >
              ✕
            </Button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <img
              src={selected.url}
              alt={selected.altText || selected.title}
              className="w-full aspect-square object-contain border-2 border-on-surface bg-surface-container"
            />

            <TextField
              label="Title"
              value={editDraft.title}
              onChange={e => setEditDraft(d => d ? { ...d, title: e.target.value } : d)}
            />

            <div>
              <Text variant="label" color="secondary" className="mb-1 block">Caption</Text>
              <textarea
                className="w-full border-2 border-on-surface p-2 bg-surface text-on-surface font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                rows={2}
                value={editDraft.caption}
                onChange={e => setEditDraft(d => d ? { ...d, caption: e.target.value } : d)}
              />
            </div>

            <TextField
              label="Alt Text"
              value={editDraft.altText}
              onChange={e => setEditDraft(d => d ? { ...d, altText: e.target.value } : d)}
            />

            <div className="space-y-1.5 pt-1 border-t-2 border-on-surface">
              <Text variant="code" color="secondary" className="break-all">{selected.url.split('/').pop()}</Text>
              {selected.mimeType && <Text variant="code" color="secondary">{selected.mimeType}{selected.fileSize ? ` · ${(selected.fileSize / 1024).toFixed(1)} KB` : ''}</Text>}
              {selected.createdAt && <Text variant="code" color="secondary">{formatDateTime(selected.createdAt)}</Text>}
            </div>
          </div>

          <div className="p-4 border-t-2 border-on-surface flex gap-2">
            <Button onClick={handleSave} disabled={saving} variant="primary" size="sm" className="flex-1">
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button onClick={() => handleDelete(selected._id)} variant="secondary" size="sm">
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
