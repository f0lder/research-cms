import { View, Text, Image, StyleSheet } from 'react-native';
import { PublicBlock, FieldType } from '@research-cms/shared-types';
import { C } from '@/lib/theme';

function BlockValue({ block }: { block: PublicBlock }) {
  if (block.value === null || block.value === undefined || block.value === '') return null;

  switch (block.type) {
    case FieldType.MEDIA: {
      const media = typeof block.value === 'object' && block.value !== null
        ? block.value as { url?: string; mimeType?: string; title?: string; caption?: string; altText?: string }
        : null;
      if (!media?.url) return null;
      const isImage = !media.mimeType || media.mimeType.startsWith('image/');
      if (isImage) {
        return (
          <View>
            <Image source={{ uri: media.url }} style={s.image} resizeMode="cover"
              accessibilityLabel={media.altText || media.title || ''} />
            {media.caption ? <Text style={s.caption}>{media.caption}</Text> : null}
          </View>
        );
      }
      return (
        <View style={s.filePill}>
          <Text style={s.fileTitle}>{media.title || media.url.split('/').pop()}</Text>
          {media.mimeType ? <Text style={s.fileMime}>{media.mimeType}</Text> : null}
        </View>
      );
    }
    case FieldType.BOOLEAN:
      return (
        <View style={[s.badge, block.value ? s.badgeGreen : s.badgeGray]}>
          <Text style={s.badgeText}>{block.value ? 'Yes' : 'No'}</Text>
        </View>
      );
    case FieldType.SELECT:
      return <View style={s.badge}><Text style={s.badgeText}>{String(block.value)}</Text></View>;
    case FieldType.TAGS: {
      const arr = Array.isArray(block.value) ? block.value : [];
      return (
        <View style={s.tagRow}>
          {arr.map((t, i) => (
            <View key={i} style={s.tag}><Text style={s.tagText}>{String(t)}</Text></View>
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
  block:      { marginBottom: 20 },
  label:      { fontSize: 10, fontWeight: '700', color: C.metaText, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontFamily: 'monospace' },
  text:       { fontSize: 15, color: C.text, lineHeight: 22 },
  textarea:   { fontSize: 15, color: C.text, lineHeight: 24 },
  mono:       { fontSize: 14, color: C.text, fontFamily: 'monospace' },
  meta:       { fontSize: 13, color: C.subText, fontFamily: 'monospace' },
  image:      { width: '100%', height: 220, borderRadius: 4, backgroundColor: C.border },
  badge:      { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 3, backgroundColor: C.border },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeGray:  { backgroundColor: C.border },
  badgeText:  { fontSize: 12, color: C.text, fontFamily: 'monospace' },
  tagRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, backgroundColor: C.border },
  tagText:    { fontSize: 11, color: C.text, fontFamily: 'monospace' },
  caption:    { fontSize: 12, color: C.subText, marginTop: 6, fontStyle: 'italic' },
  filePill:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: C.border, borderRadius: 4 },
  fileTitle:  { fontSize: 14, color: C.text, flex: 1 },
  fileMime:   { fontSize: 11, color: C.subText, fontFamily: 'monospace' },
});
