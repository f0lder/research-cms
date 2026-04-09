import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Block, HeadingBlock, TextBlock, ArchiveBlock } from '@research-cms/shared-types';
import { listEntries } from '@/lib/api';
import type { PublicEntryResponse } from '@research-cms/shared-types';
import { entryTitle, entrySubtitle } from '@/lib/helpers';
import { C, shared } from '@/lib/theme';
import { Block as FieldBlockComponent } from '@/components/Block';

function HeadingBlockRenderer({ block }: { block: HeadingBlock }) {
  const style = [
    s.heading,
    block.level === 1 && s.h1,
    block.level === 3 && s.h3,
  ];
  return <Text style={style}>{block.text}</Text>;
}

function TextBlockRenderer({ block }: { block: TextBlock }) {
  return <Text style={s.text}>{block.content}</Text>;
}

function ArchiveBlockRenderer({ block }: { block: ArchiveBlock }) {
  const [entries, setEntries] = useState<PublicEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listEntries(block.schemaSlug, 1, block.limit ?? 5)
      .then(res => setEntries(res.items))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [block.schemaSlug, block.limit]);

  return (
    <View style={s.archiveBlock}>
      {block.title ? <Text style={s.archiveTitle}>{block.title}</Text> : null}
      {loading && <ActivityIndicator size="small" color={C.accent} style={{ marginVertical: 8 }} />}
      {error ? <Text style={shared.errorText}>{error}</Text> : null}
      {entries.map(entry => (
        <TouchableOpacity
          key={entry._id}
          style={s.archiveCard}
          onPress={() => router.push(`/${block.schemaSlug}/${entry._id}` as never)}
          activeOpacity={0.7}
        >
          <Text style={s.archiveCardTitle} numberOfLines={2}>{entryTitle(entry)}</Text>
          {entrySubtitle(entry) !== null && (
            <Text style={s.archiveCardSub} numberOfLines={1}>{entrySubtitle(entry)}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function BlockRenderer({ block }: { block: Block }) {
  if (block.type === 'field') return <FieldBlockComponent block={block} />;
  if (block.type === 'heading') return <HeadingBlockRenderer block={block} />;
  if (block.type === 'text')    return <TextBlockRenderer block={block} />;
  if (block.type === 'archive') return <ArchiveBlockRenderer block={block} />;
  return null;
}

const s = StyleSheet.create({
  heading: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 12 },
  h1: { fontSize: 32 },
  h3: { fontSize: 18 },
  text: { fontSize: 16, color: C.text, lineHeight: 24, marginBottom: 16 },
  archiveBlock: { marginVertical: 20 },
  archiveTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 12 },
  archiveCard: { padding: 12, marginBottom: 8, backgroundColor: C.cardBg, borderRadius: 4 },
  archiveCardTitle: { fontSize: 15, fontWeight: '600', color: C.text },
  archiveCardSub: { fontSize: 12, color: C.subText, marginTop: 4 },
});
