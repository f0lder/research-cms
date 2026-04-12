'use client';

import { useState, useEffect } from 'react';
import { getVersions, restoreVersion } from '@/app/actions';
import { formatDate, formatTime } from '@/lib/utils';

interface Version {
  entryId: string;
  schemaSlug: string;
  data: Record<string, unknown>;
  version: number;
  createdAt: string;
}

interface VersionHistoryProps {
  schemaSlug: string;
  entryId: string;
  currentVersion: number;
  onRestore?: () => void;
}

export function VersionHistory({
  schemaSlug,
  entryId,
  currentVersion,
  onRestore,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadVersions = async () => {
      setLoading(true);
      const { data, error: err } = await getVersions(schemaSlug, entryId);
      if (err) {
        setError(err);
      } else {
        setVersions(data ?? []);
      }
      setLoading(false);
    };
    loadVersions();
  }, [schemaSlug, entryId]);

  const handleRestore = async (version: number) => {
    if (!confirm(`Restore to version ${version}?`)) return;
    
    setRestoring(version);
    const { error: err } = await restoreVersion(schemaSlug, entryId, version);
    setRestoring(null);
    
    if (err) {
      setError(err);
      return;
    }
    
    // Refresh versions list
    const { data } = await getVersions(schemaSlug, entryId);
    setVersions(data ?? []);
    
    if (onRestore) onRestore();
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-zinc-200 rounded animate-pulse" />
        <div className="h-4 bg-zinc-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="section">
      <h3 className="font-semibold text-sm text-zinc-900 mb-3">Version History</h3>
      
      {error && <div className="alert-error mb-3">{error}</div>}
      
      {versions.length === 0 ? (
        <p className="text-xs text-zinc-400">No previous versions</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {versions.map(v => (
            <div key={v.version} className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-200 rounded text-xs">
              <div>
                <p className="font-mono text-zinc-700">v{v.version}</p>
                <p className="text-zinc-400">
                  {formatDate(v.createdAt)} at {formatTime(v.createdAt)}
                </p>
              </div>
              <button
                onClick={() => handleRestore(v.version)}
                disabled={restoring === v.version}
                className="btn-secondary text-xs py-1 px-2 disabled:opacity-50"
              >
                {restoring === v.version ? 'Restoring…' : 'Restore'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
