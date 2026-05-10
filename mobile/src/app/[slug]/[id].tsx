import { useEffect, useState } from 'react';
import { ScrollView, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { PublicEntryResponse, Block } from '@research-cms/shared-types';
import { useSchemasContext } from '@/src/app/_layout';
import { getRenderedLayout } from '@/lib/api';
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

    getRenderedLayout(slug, id)
      .then((layoutData) => {
        setEntry({ _id: layoutData.entryId, schemaSlug: layoutData.schemaSlug, data: layoutData.data, blocks: layoutData.blocks });
        setBlocks(layoutData.blocks);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [slug, id]);

  if (loading) return <ActivityIndicator style={shared.center} color={C.accent} />;
  if (error || !entry) return <Text style={shared.errorText}>{error || 'Not found'}</Text>;

  // If no layout blocks, fall back to rendering each field on its own row
  if (!blocks || blocks.length === 0) {
    return (
      <ScrollView contentContainerStyle={s.content}>
        <FieldsFallback data={entry.data as Record<string, unknown>} />
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

function FieldsFallback({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (entries.length === 0) return <Text style={s.empty}>This entry has no data.</Text>;
  return (
    <>
      {entries.map(([k, v]) => (
        <View key={k} style={s.field}>
          <Text style={s.fieldLabel}>{humanize(k)}</Text>
          <Text style={s.fieldValue}>{stringify(v)}</Text>
        </View>
      ))}
    </>
  );
}

function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, c => c.toUpperCase());
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.every(v => typeof v === 'string' || typeof v === 'number')) return value.join(', ');
    return JSON.stringify(value, null, 2);
  }
  return JSON.stringify(value, null, 2);
}

const s = StyleSheet.create({
  content: { padding: 20 },
  empty: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  field: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748b',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    color: '#0f172a',
    lineHeight: 22,
  },
});
