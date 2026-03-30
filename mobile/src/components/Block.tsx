import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { PublicBlock, FieldType } from '@research-cms/shared-types';
import { C } from '../theme';

function BlockValue({ block }: { block: PublicBlock }) {
  if (block.value === null || block.value === undefined || block.value === '') return null;

  switch (block.type) {
    case FieldType.MEDIA: {
      const mediaValue = block.value as { url?: string } | string | null;
      const uri = typeof mediaValue === 'object' && mediaValue !== null ? mediaValue.url : String(mediaValue ?? '');
      if (!uri) return null;
      return <Image source={{ uri }} style={s.image} resizeMode="cover" />;
    }

    case FieldType.BOOLEAN:
      return (
        <View style={[s.badge, block.value ? s.badgeGreen : s.badgeGray]}>
          <Text style={s.badgeText}>{block.value ? 'Yes' : 'No'}</Text>
        </View>
      );

    case FieldType.SELECT:
      return (
        <View style={s.badge}>
          <Text style={s.badgeText}>{String(block.value)}</Text>
        </View>
      );

    case FieldType.TAGS: {
      const arr = Array.isArray(block.value) ? block.value : [];
      return (
        <View style={s.tagRow}>
          {arr.map((t, i) => (
            <View key={i} style={s.tag}>
              <Text style={s.tagText}>{String(t)}</Text>
            </View>
          ))}
        </View>
      );
    }

    case FieldType.TEXTAREA:
      return <Text style={s.textarea}>{String(block.value)}</Text>;

    case FieldType.NUMBER:
      return <Text style={s.mono}>{String(block.value)}</Text>;

    case FieldType.DATE:
    case FieldType.DATETIME:
      return <Text style={s.meta}>{new Date(String(block.value)).toLocaleString()}</Text>;

    default:
      return <Text style={s.text}>{String(block.value)}</Text>;
  }
}

export function Block({ block }: { block: PublicBlock }) {
  if (block.value === null || block.value === undefined || block.value === '') return null;
  return (
    <View style={s.block}>
      <Text style={s.label}>{block.label}</Text>
      <BlockValue block={block} />
    </View>
  );
}

const s = StyleSheet.create({
  block:    { marginBottom: 20 },
  label:    { fontSize: 10, fontWeight: '700', color: C.metaText, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontFamily: 'monospace' },
  text:     { fontSize: 15, color: C.text, lineHeight: 22 },
  textarea: { fontSize: 15, color: C.text, lineHeight: 24 },
  mono:     { fontSize: 14, color: C.text, fontFamily: 'monospace' },
  meta:     { fontSize: 13, color: C.subText, fontFamily: 'monospace' },
  image:    { width: '100%', height: 220, borderRadius: 4, backgroundColor: C.border },
  badge:    { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 3, backgroundColor: C.border },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeGray:  { backgroundColor: C.border },
  badgeText:  { fontSize: 12, color: C.text, fontFamily: 'monospace' },
  tagRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, backgroundColor: C.border },
  tagText:  { fontSize: 11, color: C.text, fontFamily: 'monospace' },
});
