import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, StyleSheet } from 'react-native';
import { listSchemas } from '../api';
import { API_KEY } from '../config';
import { Schema, Screen } from '../types';
import { C, shared } from '../theme';
import { Sidebar } from '../components/Sidebar';
import { NoKeyNotice } from '../components/NoKeyNotice';
import { ArchiveScreen } from '../screens/ArchiveScreen';
import { DetailScreen } from '../screens/DetailScreen';

export default function App() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    listSchemas()
      .then(data => {
        setSchemas(data);
        if (data.length > 0) {
          setScreen(prev => prev ?? { name: 'list', slug: data[0].slug, schemaName: data[0].name });
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (API_KEY) load();
    else setLoading(false);
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
  } else if (loading) {
    content = <ActivityIndicator style={shared.center} color={C.accent} />;
  } else if (error) {
    content = (
      <View style={shared.center}>
        <Text style={shared.errorText}>{error}</Text>
        <TouchableOpacity style={shared.retryBtn} onPress={load}>
          <Text style={shared.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (!screen) {
    content = <Text style={shared.empty}>Select a content type from the sidebar.</Text>;
  } else if (screen.name === 'list') {
    content = <ArchiveScreen slug={screen.slug} onSelect={goToDetail} />;
  } else {
    content = <DetailScreen slug={screen.slug} entryId={screen.entryId} />;
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={12} style={s.menuBtn}>
          <Text style={s.menuIcon}>☰</Text>
        </TouchableOpacity>

        <Text style={s.headerTitle} numberOfLines={1}>
          {screen?.schemaName ?? 'CMS'}
        </Text>

        {screen?.name === 'detail' ? (
          <TouchableOpacity onPress={goBack} hitSlop={12} style={s.backBtn}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.backBtn} />
        )}
      </View>

      <View style={s.content}>{content}</View>

      {sidebarOpen && (
        <Sidebar
          schemas={schemas}
          activeSlug={screen?.slug ?? null}
          onSelect={schema => goToList(schema.slug, schema.name)}
          onClose={() => setSidebarOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  content:     { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.headerBg, paddingHorizontal: 16, paddingVertical: 12 },
  menuBtn:     { width: 40 },
  menuIcon:    { color: C.headerText, fontSize: 20 },
  headerTitle: { flex: 1, color: C.headerText, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  backBtn:     { width: 60, alignItems: 'flex-end' },
  backText:    { color: C.accent, fontSize: 14 },
});
