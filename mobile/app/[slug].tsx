import { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { PublicEntryResponse } from '@research-cms/shared-types';
import { useSchemasContext } from '@/app/_layout';
import { listEntries } from '@/lib/api';
import { entryTitle, entrySubtitle } from '@/lib/helpers';
import { C, shared } from '@/lib/theme';

export default function ArchivePage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { schemas } = useSchemasContext();
  const navigation = useNavigation();

  const [entries, setEntries] = useState<PublicEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const schemaName = schemas.find(s => s.slug === slug)?.name ?? slug;

  useEffect(() => {
    navigation.setOptions({ title: schemaName });
  }, [schemaName, navigation]);

  useEffect(() => {
    setLoading(true);
    setError('');
    listEntries(slug)
      .then(setEntries)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

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
    />
  );
}

const s = StyleSheet.create({
  list:  { padding: 16 },
  card:  { backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 16, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 4 },
  sub:   { fontSize: 13, color: C.subText, marginBottom: 6, lineHeight: 18 },
  meta:  { fontSize: 11, color: C.metaText, fontFamily: 'monospace' },
});
