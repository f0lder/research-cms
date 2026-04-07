import { useEffect, useState, useCallback } from 'react';
import { FlatList, TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { PublicEntryResponse } from '@research-cms/shared-types';
import { useSchemasContext } from '@/src/app/_layout';
import { listEntries } from '@/lib/api';
import { entryTitle, entrySubtitle } from '@/lib/helpers';
import { C, shared } from '@/lib/theme';

const PAGE_SIZE = 20;

export default function ArchivePage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { schemas } = useSchemasContext();
  const navigation = useNavigation();

  const [entries, setEntries] = useState<PublicEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const schemaName = schemas.find(s => s.slug === slug)?.name ?? slug;

  useEffect(() => {
    navigation.setOptions({ title: schemaName });
  }, [schemaName, navigation]);

  // Reset and load first page whenever slug changes
  useEffect(() => {
    setEntries([]);
    setPage(1);
    setHasMore(false);
    setError('');
    setLoading(true);

    listEntries(slug, 1, PAGE_SIZE)
      .then(res => {
        setEntries(res.items);
        setHasMore(res.items.length < res.total);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    listEntries(slug, nextPage, PAGE_SIZE)
      .then(res => {
        setEntries(prev => [...prev, ...res.items]);
        setPage(nextPage);
        setHasMore((nextPage - 1) * PAGE_SIZE + res.items.length < res.total);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingMore(false));
  }, [slug, page, hasMore, loadingMore]);

  if (loading) return <ActivityIndicator style={shared.center} color={C.accent} />;
  if (error) return <Text style={shared.errorText}>{error}</Text>;
  if (entries.length === 0) return <Text style={shared.empty}>No published entries yet.</Text>;

  return (
    <FlatList
      data={entries}
      keyExtractor={e => e._id}
      contentContainerStyle={s.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={s.card}
          onPress={() => router.push(`/${slug}/${item._id}` as never)}
          activeOpacity={0.7}
        >
          <Text style={s.title} numberOfLines={2}>{entryTitle(item)}</Text>
          {entrySubtitle(item) !== null && (
            <Text style={s.sub} numberOfLines={2}>{entrySubtitle(item)}</Text>
          )}
          {item.createdAt && (
            <Text style={s.meta}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          )}
        </TouchableOpacity>
      )}
      ListFooterComponent={
        hasMore ? (
          <TouchableOpacity style={s.loadMore} onPress={loadMore} disabled={loadingMore} activeOpacity={0.7}>
            {loadingMore
              ? <ActivityIndicator size="small" color={C.accent} />
              : <Text style={s.loadMoreText}>Load more</Text>
            }
          </TouchableOpacity>
        ) : null
      }
    />
  );
}

const s = StyleSheet.create({
  list:         { padding: 16 },
  card:         { backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 16, marginBottom: 12 },
  title:        { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 4 },
  sub:          { fontSize: 13, color: C.subText, marginBottom: 6, lineHeight: 18 },
  meta:         { fontSize: 11, color: C.metaText, fontFamily: 'monospace' },
  loadMore:     { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 13, color: C.accent, fontFamily: 'monospace' },
});
