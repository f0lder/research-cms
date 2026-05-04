'use client';

import { useState, useEffect } from 'react';
import { getVersions, restoreVersion } from '@/app/actions';
import { formatDate, formatTime } from '@/lib/utils';
import { ListSkeleton } from '@/components/skeletons';
import { Button, Heading } from '@/components/ui';
import { Card,Container } from '@/components/ui';

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

  const showDiffPopup = (version: Version) => {
    // show a simple popup with a table that contains this verions data (no current data)
    const diffWindow = window.open('', '_blank', 'width=600,height=400,scrollbars=yes');
    if (diffWindow) {
      diffWindow.document.write('<html><head><title>Version Diff</title></head><body>');
      diffWindow.document.write('<h1>Version ' + version.version + ' Diff</h1>');
      diffWindow.document.write('<pre>' + JSON.stringify(version.data, null, 2) + '</pre>');
      diffWindow.document.write('</body></html>');
    }
  };

  if (loading) {
    return (
      <Container className="mt-8">
        <Heading level={3}>Version History</Heading>
        <ListSkeleton />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-8">
        <Heading level={3}>Version History</Heading>
        <div className="alert-error">{error}</div>
      </Container>
    );
  }

  return (
    <Container padding='none' className="mt-8">
      <Heading level={3}>Version History</Heading>
      
      {error && <div className="alert-error mb-3">{error}</div>}
      
      {versions.length === 0 ? (
        <p className="text-xs text-zinc-400">No previous versions</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {versions.map(v => (
            <Card key={v.version}>
              <div>
                <p className="font-mono text-zinc-700">v{v.version}</p>
                <p className="text-zinc-400">
                  {formatDate(v.createdAt)} at {formatTime(v.createdAt)}
                </p>
              </div>
              <Button
                size="xs"
                onClick={() => handleRestore(v.version)}
                disabled={restoring === v.version}
              >
                {restoring === v.version ? 'Restoring…' : 'Restore'}
              </Button>
              <Button
                size="xs"
                variant='secondary'
                onClick={() => showDiffPopup(v)}
              >
                Preview (diff)
              </Button>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
