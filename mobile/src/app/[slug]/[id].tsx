import { useEffect, useState } from 'react';
import { ScrollView, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { PublicEntryResponse } from '@research-cms/shared-types';
import { useSchemasContext } from '@/src/app/_layout';
import { getEntry } from '@/lib/api';
import { Block } from '@/components/Block';
import { C, shared } from '@/lib/theme';

export default function DetailPage() {
  const { slug, id } = useLocalSearchParams<{ slug: string; id: string }>();
  const { schemas } = useSchemasContext();
  const navigation = useNavigation();

  const [entry, setEntry] = useState<PublicEntryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const schemaName = schemas.find(s => s.slug === slug)?.name ?? slug;

  useEffect(() => {
    navigation.setOptions({ title: schemaName });
  }, [schemaName, navigation]);

  useEffect(() => {
    setLoading(true);
    setError('');
    getEntry(slug, id)
      .then(setEntry)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug, id]);

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
