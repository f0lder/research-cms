import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { FieldBlock, FieldType } from '@research-cms/shared-types';
import { C } from '@/lib/theme';

function BlockValue({ block }: { block: FieldBlock }) {
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
    case 'boolean':
      return (
        <View style={[s.badge, block.value ? s.badgeGreen : s.badgeGray]}>
          <Text style={s.badgeText}>{block.value ? 'Yes' : 'No'}</Text>
        </View>
      );
    case 'select':
      return <View style={s.badge}><Text style={s.badgeText}>{String(block.value)}</Text></View>;
    case 'tags': {
      const arr = Array.isArray(block.value) ? block.value : [];
      return (
        <View style={s.tagRow}>
          {arr.map((t, i) => (
            <View key={i} style={s.tag}><Text style={s.tagText}>{String(t)}</Text></View>
          ))}
        </View>
      );
    }
    case 'textarea':
      return <Text style={s.textarea}>{String(block.value)}</Text>;
    case 'number':
      return <Text style={s.mono}>{String(block.value)}</Text>;
    case 'date':
    case 'datetime':
      return <Text style={s.meta}>{new Date(String(block.value)).toLocaleString()}</Text>;
    case 'reference': {
      // Single reference - could be an ID string or an entry object
      const entryId = typeof block.value === 'string' ? block.value : (block.value as any)?._id;
      if (!entryId) return null;
      return (
        <TouchableOpacity 
          onPress={() => router.push(`/${block.fieldName === 'author' ? 'users' : 'entries'}/${entryId}`)}
          style={s.referenceLink}
        >
          <Text style={s.referenceLinkText}>
            {/* Show entry title if resolved, otherwise fallback to ID */}
            {(block.value as any)?.title || (block.value as any)?.name || entryId.slice(0, 8)}
          </Text>
        </TouchableOpacity>
      );
    }
    case 'references': {
      // Multiple references - array of IDs or entry objects
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
                style={s.referenceTag}
              >
                <Text style={s.referenceTagText}>
                  {(ref as any)?.title || (ref as any)?.name || entryId.slice(0, 8)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }
    default:
      return <Text style={s.text}>{String(block.value)}</Text>;
  }
}

export function Block({ block }: { block: FieldBlock }) {
  // Field blocks should have values resolved by the API
  // If no value, don't render anything
  if (block.value === null || block.value === undefined || block.value === '') return null;
  
  return (
    <View style={s.block}>
      {block.showLabel !== false && block.labelPosition !== 'hidden' && (
        <Text style={s.label}>{block.label}</Text>
      )}
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
  referenceLink: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, backgroundColor: C.border, borderLeftWidth: 3, borderLeftColor: C.accent },
  referenceLinkText: { fontSize: 14, color: C.accent, fontWeight: '500' },
  referenceList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  referenceTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: C.border, borderWidth: 1, borderColor: C.accent },
  referenceTagText: { fontSize: 13, color: C.accent, fontWeight: '500' },
  caption:    { fontSize: 12, color: C.subText, marginTop: 6, fontStyle: 'italic' },
  filePill:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: C.border, borderRadius: 4 },
  fileTitle:  { fontSize: 14, color: C.text, flex: 1 },
  fileMime:   { fontSize: 11, color: C.subText, fontFamily: 'monospace' },
});
