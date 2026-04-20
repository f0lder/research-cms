import { useEffect, useState } from 'react';
import { ScrollView, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { PublicEntryResponse, Block } from '@research-cms/shared-types';
import { useSchemasContext } from '@/src/app/_layout';
import { getEntry, getLayout } from '@/lib/api';
import { C, shared } from '@/lib/theme';
import { BlockRenderer } from '@/components/BlockRenderer';

export default function DetailPage() {
  const { slug, id } = useLocalSearchParams<{ slug: string; id: string }>();
  const { schemas } = useSchemasContext();
  const navigation = useNavigation();

  const [entry, setEntry] = useState<PublicEntryResponse | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const schemaName = schemas.find(s => s.slug === slug)?.name ?? slug;

  useEffect(() => {
    navigation.setOptions({ title: schemaName });
  }, [schemaName, navigation]);

  useEffect(() => {
    setLoading(true);
    setError('');

    Promise.all([
      getEntry(slug, id).catch((e: Error) => {
        setError(e.message);
        return null;
      }),
      getLayout(slug).catch(() => null),
    ]).then(([entryData, layoutData]) => {
      if (entryData) setEntry(entryData);
      if (layoutData?.blocks) setBlocks(layoutData.blocks);
      setLoading(false);
    });
  }, [slug, id]);

  if (loading) return <ActivityIndicator style={shared.center} color={C.accent} />;
  if (error || !entry) return <Text style={shared.errorText}>{error || 'Not found'}</Text>;

  // If no layout blocks, show entry data message
  if (!blocks || blocks.length === 0) {
    return (
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.empty}>No layout configured for this schema</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.content}>
      {blocks.map((block, i) => (
        <BlockRenderer
          key={i}
          block={block}
          entryData={entry.data as Record<string, any>}
        />
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20 },
  empty: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40
  },
});
