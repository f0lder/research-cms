import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
  Modal, FlatList, Pressable,
} from 'react-native';
import { PublicBlock, PublicEntryResponse, FieldType } from '@research-cms/shared-types';
import { listSchemas, listEntries, getEntry } from '../api';
import { API_KEY } from '../config';

// ── Types ─────────────────────────────────────────────────────────────────────

type Screen =
  | { name: 'list'; slug: string; schemaName: string }
  | { name: 'detail'; slug: string; schemaName: string; entryId: string };

type Schema = { slug: string; name: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function entryTitle(entry: PublicEntryResponse): string {
  const titleBlock = entry.blocks.find(b => b.fieldName === 'title');
  if (titleBlock?.value && typeof titleBlock.value === 'string') return titleBlock.value;
  const first = entry.blocks.find(b => typeof b.value === 'string' && b.value);
  return first ? String(first.value).slice(0, 50) : `#${entry._id.slice(-6)}`;
}

function entrySubtitle(entry: PublicEntryResponse): string | null {
  const sub = entry.blocks.find(
    b => b.fieldName !== 'title' && typeof b.value === 'string' && b.value
  );
  return sub ? String(sub.value).slice(0, 80) : null;
}

// ── Block renderer ────────────────────────────────────────────────────────────

function BlockValue({ block }: { block: PublicBlock }) {
  if (block.value === null || block.value === undefined || block.value === '') return null;

  switch (block.type) {
    case FieldType.IMAGE:
      return (
        <Image
          source={{ uri: String(block.value) }}
          style={styles.blockImage}
          resizeMode="cover"
        />
      );

    case FieldType.BOOLEAN:
      return (
        <View style={[styles.badge, block.value ? styles.badgeGreen : styles.badgeGray]}>
          <Text style={styles.badgeText}>{block.value ? 'Yes' : 'No'}</Text>
        </View>
      );

    case FieldType.SELECT:
      return (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{String(block.value)}</Text>
        </View>
      );

    case FieldType.TAGS: {
      const arr = Array.isArray(block.value) ? block.value : [];
      return (
        <View style={styles.tagRow}>
          {arr.map((t, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{String(t)}</Text>
            </View>
          ))}
        </View>
      );
    }

    case FieldType.TEXTAREA:
      return <Text style={styles.blockTextarea}>{String(block.value)}</Text>;

    case FieldType.NUMBER:
      return <Text style={styles.blockMono}>{String(block.value)}</Text>;

    case FieldType.DATE:
    case FieldType.DATETIME:
      return (
        <Text style={styles.blockMeta}>
          {new Date(String(block.value)).toLocaleString()}
        </Text>
      );

    default:
      return <Text style={styles.blockText}>{String(block.value)}</Text>;
  }
}

function Block({ block }: { block: PublicBlock }) {
  if (block.value === null || block.value === undefined || block.value === '') return null;
  return (
    <View style={styles.block}>
      <Text style={styles.blockLabel}>{block.label}</Text>
      <BlockValue block={block} />
    </View>
  );
}

// ── No API key notice ─────────────────────────────────────────────────────────

function NoKeyNotice() {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>API key not set</Text>
      <Text style={styles.noticeBody}>
        Open{' '}
        <Text style={styles.code}>mobile/src/config.ts</Text>
        {' '}and paste your API key.{'\n'}
        Generate one in the admin under{' '}
        <Text style={styles.code}>API Keys</Text>.
      </Text>
    </View>
  );
}

// ── Archive screen ────────────────────────────────────────────────────────────

function ArchiveScreen({
  slug,
  onSelect,
}: {
  slug: string;
  onSelect: (id: string) => void;
}) {
  const [entries, setEntries] = useState<PublicEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    listEntries(slug)
      .then(setEntries)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <ActivityIndicator style={styles.center} color={C.accent} />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;
  if (entries.length === 0) {
    return <Text style={styles.empty}>No published entries yet.</Text>;
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={e => e._id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => onSelect(item._id)} activeOpacity={0.7}>
          <Text style={styles.cardTitle} numberOfLines={2}>{entryTitle(item)}</Text>
          {entrySubtitle(item) !== null && (
            <Text style={styles.cardSub} numberOfLines={2}>{entrySubtitle(item)}</Text>
          )}
          {item.createdAt && (
            <Text style={styles.cardMeta}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

// ── Detail screen ─────────────────────────────────────────────────────────────

function DetailScreen({ slug, entryId }: { slug: string; entryId: string }) {
  const [entry, setEntry] = useState<PublicEntryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getEntry(slug, entryId)
      .then(setEntry)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug, entryId]);

  if (loading) return <ActivityIndicator style={styles.center} color={C.accent} />;
  if (error || !entry) return <Text style={styles.errorText}>{error || 'Not found'}</Text>;

  return (
    <ScrollView contentContainerStyle={styles.detailContent}>
      {entry.blocks.map((block, i) => <Block key={i} block={block} />)}
      {entry.createdAt && (
        <Text style={styles.detailMeta}>
          Published {new Date(entry.createdAt).toLocaleDateString()}
        </Text>
      )}
    </ScrollView>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  schemas,
  activeSlug,
  onSelect,
  onClose,
}: {
  schemas: Schema[];
  activeSlug: string | null;
  onSelect: (s: Schema) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible transparent animationType="fade">
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.drawer}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Content Types</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.drawerClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            {schemas.length === 0 ? (
              <Text style={styles.drawerEmpty}>No content types available.</Text>
            ) : (
              schemas.map(s => (
                <TouchableOpacity
                  key={s.slug}
                  style={[styles.drawerItem, activeSlug === s.slug && styles.drawerItemActive]}
                  onPress={() => { onSelect(s); onClose(); }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.drawerItemText,
                    activeSlug === s.slug && styles.drawerItemTextActive,
                  ]}>
                    {s.name}
                  </Text>
                  <Text style={styles.drawerItemSlug}>/{s.slug}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingSchemas, setLoadingSchemas] = useState(true);
  const [schemasError, setSchemasError] = useState('');

  const load = useCallback(() => {
    setLoadingSchemas(true);
    setSchemasError('');
    listSchemas()
      .then(data => {
        setSchemas(data);
        if (data.length > 0) {
          setScreen(prev => prev ?? { name: 'list', slug: data[0].slug, schemaName: data[0].name });
        }
      })
      .catch((e: Error) => setSchemasError(e.message))
      .finally(() => setLoadingSchemas(false));
  }, []);

  useEffect(() => {
    if (API_KEY) load();
    else setLoadingSchemas(false);
  }, [load]);

  const goToList = (slug: string, schemaName: string) =>
    setScreen({ name: 'list', slug, schemaName });

  const goToDetail = (entryId: string) => {
    if (!screen) return;
    setScreen({ name: 'detail', slug: screen.slug, schemaName: screen.schemaName, entryId });
  };

  const goBack = () => {
    if (screen?.name === 'detail') {
      setScreen({ name: 'list', slug: screen.slug, schemaName: screen.schemaName });
    }
  };

  let content: React.ReactNode;
  if (!API_KEY) {
    content = <NoKeyNotice />;
  } else if (loadingSchemas) {
    content = <ActivityIndicator style={styles.center} color={C.accent} />;
  } else if (schemasError) {
    content = (
      <View style={styles.center}>
        <Text style={styles.errorText}>{schemasError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (!screen) {
    content = <Text style={styles.empty}>Select a content type from the sidebar.</Text>;
  } else if (screen.name === 'list') {
    content = <ArchiveScreen slug={screen.slug} onSelect={goToDetail} />;
  } else {
    content = <DetailScreen slug={screen.slug} entryId={screen.entryId} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={12} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {screen?.schemaName ?? 'CMS'}
        </Text>

        {screen?.name === 'detail' ? (
          <TouchableOpacity onPress={goBack} hitSlop={12} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      {/* Main content */}
      <View style={styles.content}>{content}</View>

      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          schemas={schemas}
          activeSlug={screen?.slug ?? null}
          onSelect={s => goToList(s.slug, s.name)}
          onClose={() => setSidebarOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ── Colors ────────────────────────────────────────────────────────────────────

const C = {
  bg:         '#fafafa',
  headerBg:   '#18181b',
  headerText: '#ffffff',
  accent:     '#3b82f6',
  border:     '#e4e4e7',
  text:       '#18181b',
  subText:    '#71717a',
  metaText:   '#a1a1aa',
  cardBg:     '#ffffff',
  drawerBg:   '#18181b',
  drawerText: '#d4d4d8',
  drawerActive: '#3f3f46',
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.headerBg, paddingHorizontal: 16, paddingVertical: 12,
  },
  menuBtn:     { width: 40 },
  menuIcon:    { color: C.headerText, fontSize: 20 },
  headerTitle: { flex: 1, color: C.headerText, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  backBtn:     { width: 60, alignItems: 'flex-end' },
  backText:    { color: C.accent, fontSize: 14 },

  // Archive list
  listContent: { padding: 16 },
  card: {
    backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border,
    borderRadius: 6, padding: 16, marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 4 },
  cardSub:   { fontSize: 13, color: C.subText, marginBottom: 6, lineHeight: 18 },
  cardMeta:  { fontSize: 11, color: C.metaText, fontFamily: 'monospace' },

  // Detail
  detailContent: { padding: 20 },
  detailMeta:    { marginTop: 24, fontSize: 11, color: C.metaText, fontFamily: 'monospace' },

  // Blocks
  block:      { marginBottom: 20 },
  blockLabel: {
    fontSize: 10, fontWeight: '700', color: C.metaText,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontFamily: 'monospace',
  },
  blockText:     { fontSize: 15, color: C.text, lineHeight: 22 },
  blockTextarea: { fontSize: 15, color: C.text, lineHeight: 24 },
  blockMono:     { fontSize: 14, color: C.text, fontFamily: 'monospace' },
  blockMeta:     { fontSize: 13, color: C.subText, fontFamily: 'monospace' },
  blockImage:    { width: '100%', height: 220, borderRadius: 4, backgroundColor: C.border },

  // Badges / tags
  badge:      { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 3, backgroundColor: C.border },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeGray:  { backgroundColor: C.border },
  badgeText:  { fontSize: 12, color: C.text, fontFamily: 'monospace' },
  tagRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, backgroundColor: C.border },
  tagText:    { fontSize: 11, color: C.text, fontFamily: 'monospace' },

  // Sidebar / drawer
  scrim:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 260,
    backgroundColor: C.drawerBg, elevation: 16,
    boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
  } as never,
  drawerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: '#27272a',
  },
  drawerTitle:         { color: '#ffffff', fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  drawerClose:         { color: '#71717a', fontSize: 16 },
  drawerEmpty:         { color: '#52525b', fontSize: 13, padding: 16, fontFamily: 'monospace' },
  drawerItem: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderLeftWidth: 2, borderLeftColor: 'transparent',
  },
  drawerItemActive:     { borderLeftColor: '#ffffff', backgroundColor: C.drawerActive },
  drawerItemText:       { color: C.drawerText, fontSize: 13, marginBottom: 2 },
  drawerItemTextActive: { color: '#ffffff', fontWeight: '600' },
  drawerItemSlug:       { color: '#52525b', fontSize: 10, fontFamily: 'monospace' },

  // States
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  empty:     { padding: 32, textAlign: 'center', color: C.subText, fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', padding: 16 },
  retryBtn:  { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: C.accent, borderRadius: 4 },
  retryText: { color: '#fff', fontSize: 14 },

  // No-key notice
  notice:      { margin: 24, padding: 20, borderWidth: 1, borderColor: C.border, borderRadius: 6 },
  noticeTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 8 },
  noticeBody:  { fontSize: 13, color: C.subText, lineHeight: 20 },
  code:        { fontFamily: 'monospace', color: C.text },
});
