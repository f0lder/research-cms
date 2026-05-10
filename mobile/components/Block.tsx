import { View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import RenderHtml from 'react-native-render-html';
import { FieldBlock, FieldType } from '@research-cms/shared-types';
import { useTheme } from '../src/app/_layout';

function BlockValue({ block, colors }: { block: FieldBlock; colors: ReturnType<typeof useTheme> }) {
  if (block.value === null || block.value === undefined || block.value === '') return null;

  switch (block.fieldType) {
    case 'media': {
      const media = typeof block.value === 'object' && block.value !== null
        ? block.value as { url?: string; mimeType?: string; title?: string; caption?: string; altText?: string }
        : null;
      if (!media?.url) return null;
      const isImage = !media.mimeType || media.mimeType.startsWith('image/');
      if (isImage) {
        return (
          <View>
            <Image source={{ uri: media.url }} style={[s.image, { backgroundColor: colors.border }]} resizeMode="cover"
              accessibilityLabel={media.altText || media.title || ''} />
            {media.caption ? <Text style={[s.caption, { color: colors.subText }]}>{media.caption}</Text> : null}
          </View>
        );
      }
      return (
        <View style={[s.filePill, { backgroundColor: colors.border }]}>
          <Text style={[s.fileTitle, { color: colors.text }]}>{media.title || media.url.split('/').pop()}</Text>
          {media.mimeType ? <Text style={[s.fileMime, { color: colors.subText }]}>{media.mimeType}</Text> : null}
        </View>
      );
    }
    case 'boolean':
      return (
        <View style={[s.badge, block.value ? s.badgeGreen : { backgroundColor: colors.border }]}>
          <Text style={[s.badgeText, { color: colors.text }]}>{block.value ? 'Yes' : 'No'}</Text>
        </View>
      );
    case 'select':
      return <View style={[s.badge, { backgroundColor: colors.border }]}><Text style={[s.badgeText, { color: colors.text }]}>{String(block.value)}</Text></View>;
    case 'tags': {
      const arr = Array.isArray(block.value) ? block.value : [];
      return (
        <View style={s.tagRow}>
          {arr.map((t, i) => (
            <View key={i} style={[s.tag, { backgroundColor: colors.border }]}><Text style={[s.tagText, { color: colors.text }]}>{String(t)}</Text></View>
          ))}
        </View>
      );
    }
    case 'textarea':
      return <Text style={[s.textarea, { color: colors.text }]}>{String(block.value)}</Text>;
    case 'richtext':
      return <RichTextValue html={String(block.value)} colors={colors} />;
    case 'number':
      return <Text style={[s.mono, { color: colors.text }]}>{String(block.value)}</Text>;
    case 'date':
    case 'datetime':
      return <Text style={[s.meta, { color: colors.subText }]}>{new Date(String(block.value)).toLocaleString()}</Text>;
    case 'reference': {
      const entryId = typeof block.value === 'string' ? block.value : (block.value as any)?._id;
      if (!entryId) return null;
      return (
        <TouchableOpacity 
          onPress={() => router.push(`/${block.fieldName === 'author' ? 'users' : 'entries'}/${entryId}`)}
          style={[s.referenceLink, { backgroundColor: colors.border, borderLeftColor: colors.accent }]}
        >
          <Text style={[s.referenceLinkText, { color: colors.accent }]}>
            {(block.value as any)?.title || (block.value as any)?.name || entryId.slice(0, 8)}
          </Text>
        </TouchableOpacity>
      );
    }
    case 'references': {
      const arr = Array.isArray(block.value) ? block.value : [];
      return (
        <View style={s.referenceList}>
          {arr.map((ref, i) => {
            const entryId = typeof ref === 'string' ? ref : (ref as any)?._id;
            if (!entryId) return null;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => router.push(`/${block.fieldName}/${entryId}`)}
                style={[s.referenceTag, { backgroundColor: colors.border, borderColor: colors.accent }]}
              >
                <Text style={[s.referenceTagText, { color: colors.accent }]}>
                  {(ref as any)?.title || (ref as any)?.name || entryId.slice(0, 8)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }
    default:
      return <Text style={[s.text, { color: colors.text }]}>{String(block.value)}</Text>;
  }
}

function RichTextValue({ html, colors }: { html: string; colors: ReturnType<typeof useTheme> }) {
  const { width } = useWindowDimensions();
  const trimmed = html.trim();
  if (!trimmed) return null;
  return (
    <RenderHtml
      contentWidth={width}
      source={{ html: trimmed }}
      baseStyle={{ color: colors.text, fontSize: 15, lineHeight: 22 }}
      tagsStyles={{
        a: { color: colors.accent, textDecorationLine: 'underline' },
        p: { marginTop: 0, marginBottom: 8 },
        h1: { fontSize: 22, fontWeight: '700', marginTop: 12, marginBottom: 6 },
        h2: { fontSize: 19, fontWeight: '700', marginTop: 10, marginBottom: 6 },
        h3: { fontSize: 17, fontWeight: '700', marginTop: 8, marginBottom: 4 },
        code: { fontFamily: 'monospace', backgroundColor: colors.border, paddingHorizontal: 4, borderRadius: 3 },
        blockquote: { borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 10, marginLeft: 0, fontStyle: 'italic' },
      }}
    />
  );
}

export function Block({ block }: { block: FieldBlock }) {
  const colors = useTheme();
  
  if (block.value === null || block.value === undefined || block.value === '') return null;
  
  return (
    <View style={s.block}>
      {block.showLabel !== false && block.labelPosition !== 'hidden' && (
        <Text style={[s.label, { color: colors.metaText }]}>{block.label}</Text>
      )}
      <BlockValue block={block} colors={colors} />
    </View>
  );
}

const s = StyleSheet.create({
  block:      { marginBottom: 20 },
  label:      { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontFamily: 'monospace' },
  text:       { fontSize: 15, lineHeight: 22 },
  textarea:   { fontSize: 15, lineHeight: 24 },
  mono:       { fontSize: 14, fontFamily: 'monospace' },
  meta:       { fontSize: 13, fontFamily: 'monospace' },
  image:      { width: '100%', height: 220, borderRadius: 4 },
  badge:      { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 3 },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeText:  { fontSize: 12, fontFamily: 'monospace' },
  tagRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 },
  tagText:    { fontSize: 11, fontFamily: 'monospace' },
  referenceLink: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, borderLeftWidth: 3 },
  referenceLinkText: { fontSize: 14, fontWeight: '500' },
  referenceList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  referenceTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1 },
  referenceTagText: { fontSize: 13, fontWeight: '500' },
  caption:    { fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  filePill:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 4 },
  fileTitle:  { fontSize: 14, flex: 1 },
  fileMime:   { fontSize: 11, fontFamily: 'monospace' },
});
