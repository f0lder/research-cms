import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, ActivityIndicator, StyleSheet, Text,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { PublicEntryResponse } from '@research-cms/shared-types';
import { getPage } from '@/lib/api';
import { C, shared } from '@/lib/theme';
import { BlockRenderer } from '@/components/BlockRenderer';

export default function PageScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const navigation = useNavigation();

  const [page, setPage] = useState<PublicEntryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!slug) {
      setError('No page slug provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const p = await getPage(slug);
      setPage(p);
      const title = (p.data as any)?.title || 'Page';
      navigation.setOptions({ title: String(title) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load page';
      setError(msg);
      console.error('Error loading page:', e);
    } finally {
      setLoading(false);
    }
  }, [slug, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <ActivityIndicator style={shared.center} color={C.accent} />;
  }

  if (error || !page) {
    return <Text style={shared.errorText}>{error || 'Page not found'}</Text>;
  }

  // Pages store blocks in data.blocks
  const blocks = (page.data as any)?.blocks || [];

  return (
    <ScrollView contentContainerStyle={s.container}>
      {Array.isArray(blocks) && blocks.length > 0 ? (
        blocks.map((block: any, i: number) => (
          <BlockRenderer key={i} block={block} entryData={page.data as Record<string, any>} />
        ))
      ) : (
        <Text style={s.empty}>No content</Text>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 20 },
  empty: { fontSize: 16, color: C.subText, textAlign: 'center', marginVertical: 24 },
});
