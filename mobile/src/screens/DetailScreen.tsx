import React, { useState, useEffect } from 'react';
import { ScrollView, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { PublicEntryResponse } from '@research-cms/shared-types';
import { getEntry } from '../api';
import { Block } from '../components/Block';
import { C, shared } from '../theme';

interface Props {
  slug: string;
  entryId: string;
}

export function DetailScreen({ slug, entryId }: Props) {
  const [entry, setEntry] = useState<PublicEntryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getEntry(slug, entryId)
      .then(setEntry)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug, entryId]);

  if (loading) return <ActivityIndicator style={shared.center} color={C.accent} />;
  if (error || !entry) return <Text style={shared.errorText}>{error || 'Not found'}</Text>;

  return (
    <ScrollView contentContainerStyle={s.content}>
      {entry.blocks.map((block, i) => <Block key={i} block={block} />)}
      {entry.createdAt && (
        <Text style={s.meta}>Published {new Date(entry.createdAt).toLocaleDateString()}</Text>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20 },
  meta:    { marginTop: 24, fontSize: 11, color: C.metaText, fontFamily: 'monospace' },
});
