import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text, View, StyleSheet, Image } from 'react-native';
import { registerBuiltInBlocks, PageEntryResponse, MenuItem } from '@research-cms/shared-types';
import { listSchemas, listPages, getClientSettings, getMenu, getMedia } from '@/lib/api';
import { AuthProvider } from '@/lib/auth-context';
import { Sidebar } from '@/components/Sidebar';
import { C, createColors } from '@/lib/theme';

// Initialize block registry on app startup
registerBuiltInBlocks();

type Schema = { slug: string; name: string };

type ThemeColors = ReturnType<typeof createColors>;

type AppCtx = {
  schemas: Schema[];
  pages: PageEntryResponse[];
  settings: Record<string, unknown>;
  colors: ThemeColors;
  loading: boolean;
  error: string;
  openSidebar: () => void;
  headerMenuItems: MenuItem[];
  footerMenuItems: MenuItem[];
};

const AppContext = createContext<AppCtx>({
  schemas: [],
  pages: [],
  settings: {},
  colors: C,
  loading: true,
  error: '',
  openSidebar: () => {},
  headerMenuItems: [],
  footerMenuItems: [],
});

export const useSchemasContext = () => useContext(AppContext);
export const useTheme = () => useContext(AppContext).colors;

export default function RootLayout() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [pages, setPages] = useState<PageEntryResponse[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [colors, setColors] = useState<ThemeColors>(C);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerMenuItems, setHeaderMenuItems] = useState<MenuItem[]>([]);
  const [footerMenuItems, setFooterMenuItems] = useState<MenuItem[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);
  const activeSlug = segments[0] === 'pages' ? (segments[1] ?? null) : (segments[0] ?? null);

  useEffect(() => {
    Promise.all([
      listSchemas().catch(() => [] as Schema[]),
      listPages().catch(() => [] as PageEntryResponse[]),
      getClientSettings().catch(() => ({} as Record<string, unknown>)),
      getMenu('header').then(r => r.items).catch(() => [] as MenuItem[]),
      getMenu('footer').then(r => r.items).catch(() => [] as MenuItem[]),
    ]).then(([s, p, st, hmi, fmi]) => {
      setSchemas(s);
      setPages(p);
      setSettings(st);
      setColors(createColors(st));
      if (hmi.length > 0) setHeaderMenuItems(hmi);
      if (fmi.length > 0) setFooterMenuItems(fmi);
      const logoId = st['client.theme.logo'] as string | undefined;
      if (logoId) {
        getMedia(logoId).then(m => setLogoUrl((m.data?.url as string) ?? '')).catch(() => {});
      }
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

  const itemHref = (item: MenuItem): string => {
    switch (item.type) {
      case 'page':   return `/pages/${item.pageSlug ?? ''}`;
      case 'entry':  return `/${item.schemaSlug ?? ''}/${item.entryId ?? ''}`;
      case 'archive': return `/${item.archiveSchema ?? ''}`;
      case 'external': return item.url ?? '#';
    }
  };

  return (
    <AuthProvider>
      <AppContext.Provider value={{ schemas, pages, settings, colors, loading, error, openSidebar, headerMenuItems, footerMenuItems }}>
        <StatusBar style={colors.headerText === '#FFFFFF' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerText,
            headerTitleStyle: { fontWeight: '600', fontSize: 16 },
            headerLeft: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={openSidebar} hitSlop={12} style={s.menuBtn}>
                  <Text style={{ color: colors.headerText, fontSize: 20 }}>☰</Text>
                </TouchableOpacity>
                {logoUrl ? (
                  <TouchableOpacity onPress={() => router.push('/' as never)} hitSlop={8}>
                    <Image source={{ uri: logoUrl }} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ),
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        {footerMenuItems.length > 0 && (
          <View style={{ backgroundColor: colors.footerBg, paddingVertical: 16, paddingHorizontal: 12 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
              {footerMenuItems.map(item => (
                <TouchableOpacity key={item.id} onPress={() => {
                  if (item.type === 'external') return;
                  router.push(itemHref(item) as never);
                }}>
                  <Text style={{ color: colors.footerTextColor, fontSize: 13, opacity: 0.85 }}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        <Sidebar
          visible={sidebarOpen}
          schemas={schemas}
          pages={pages}
          headerMenuItems={headerMenuItems}
          homePageId={(settings['client.homePage'] as string) ?? null}
          activeSlug={activeSlug}
          onSelect={handleSelect}
          onClose={() => setSidebarOpen(false)}
        />
      </AppContext.Provider>
    </AuthProvider>
  );
}

const s = StyleSheet.create({
  menuBtn:  { marginLeft: 4 },
});
