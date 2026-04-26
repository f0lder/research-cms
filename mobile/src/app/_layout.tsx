import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { registerBuiltInBlocks, PageEntryResponse } from '@research-cms/shared-types';
import { listSchemas, listPages, getClientSettings } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { C } from '@/lib/theme';

// Initialize block registry on app startup
registerBuiltInBlocks();

type Schema = { slug: string; name: string };

type AppCtx = {
  schemas: Schema[];
  pages: PageEntryResponse[];
  settings: Record<string, unknown>;
  loading: boolean;
  error: string;
  openSidebar: () => void;
};

const AppContext = createContext<AppCtx>({
  schemas: [],
  pages: [],
  settings: {},
  loading: true,
  error: '',
  openSidebar: () => {},
});

export const useSchemasContext = () => useContext(AppContext);

export default function RootLayout() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [pages, setPages] = useState<PageEntryResponse[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);
  // For /pages/<slug> routes, use the page slug; for /<schemaSlug> use that directly
  const activeSlug = segments[0] === 'pages' ? (segments[1] ?? null) : (segments[0] ?? null);

  useEffect(() => {
    Promise.all([
      listSchemas().catch(() => [] as Schema[]),
      listPages().catch(() => [] as PageEntryResponse[]),
      getClientSettings().catch(() => ({} as Record<string, unknown>)),
    ]).then(([s, p, st]) => {
      setSchemas(s);
      setPages(p);
      setSettings(st);
      setLoading(false);
    }).catch((e: Error) => {
      setError(e.message);
      setLoading(false);
    });
  }, []);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  const handleSelect = useCallback((path: string) => {
    setSidebarOpen(false);
    router.push(path as never);
  }, []);

  return (
    <AppContext.Provider value={{ schemas, pages, settings, loading, error, openSidebar }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.headerBg },
          headerTintColor: C.headerText,
          headerTitleStyle: { fontWeight: '600', fontSize: 16 },
          headerLeft: () => (
            <TouchableOpacity onPress={openSidebar} hitSlop={12} style={s.menuBtn}>
              <Text style={s.menuIcon}>☰</Text>
            </TouchableOpacity>
          ),
          contentStyle: { backgroundColor: C.bg },
        }}
      />
      <Sidebar
        visible={sidebarOpen}
        schemas={schemas}
        pages={pages}
        homePageId={(settings['client.homePage'] as string) ?? null}
        activeSlug={activeSlug}
        onSelect={handleSelect}
        onClose={() => setSidebarOpen(false)}
      />
    </AppContext.Provider>
  );
}

const s = StyleSheet.create({
  menuBtn:  { marginLeft: 4 },
  menuIcon: { color: C.headerText, fontSize: 20 },
});
