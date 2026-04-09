import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, ActivityIndicator, StyleSheet, Text,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { ClientPage } from '@research-cms/shared-types';
import { getPage } from '@/lib/api';
import { C, shared } from '@/lib/theme';
import { BlockRenderer } from '@/components/BlockRenderer';

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function PageScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const navigation = useNavigation();

  const [page, setPage] = useState<ClientPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getPage(slug)
      .then(p => { setPage(p); navigation.setOptions({ title: p.title }); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug, navigation]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <ActivityIndicator style={shared.center} color={C.accent} />;
  if (error || !page) return <Text style={shared.errorText}>{error || 'Page not found'}</Text>;

  return (
    <ScrollView contentContainerStyle={s.container}>
      {page.blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:        { padding: 20 },
  heading:          { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 12, marginTop: 8 },
  h1:               { fontSize: 28 },
  h3:               { fontSize: 17 },
  text:             { fontSize: 15, color: C.text, lineHeight: 24, marginBottom: 16 },
  archiveBlock:     { marginBottom: 24 },
  archiveTitle:     { fontSize: 13, fontWeight: '700', color: C.metaText, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontFamily: 'monospace' },
  archiveCard:      { backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 14, marginBottom: 8 },
  archiveCardTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  archiveCardSub:   { fontSize: 12, color: C.subText },
});
