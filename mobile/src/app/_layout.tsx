import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { listSchemas } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { C } from '@/lib/theme';

type Schema = { slug: string; name: string };
type SchemasCtx = {
  schemas: Schema[];
  loading: boolean;
  error: string;
  openSidebar: () => void;
};

const SchemasContext = createContext<SchemasCtx>({
  schemas: [],
  loading: true,
  error: '',
  openSidebar: () => {},
});
export const useSchemasContext = () => useContext(SchemasContext);

export default function RootLayout() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const activeSlug = pathname.split('/').filter(Boolean)[0] ?? null;

  useEffect(() => {
    listSchemas()
      .then(setSchemas)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  const handleSelect = useCallback((slug: string) => {
    setSidebarOpen(false);
    router.push(`/${slug}` as never);
  }, []);

  return (
    <SchemasContext.Provider value={{ schemas, loading, error, openSidebar }}>
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
        activeSlug={activeSlug}
        onSelect={handleSelect}
        onClose={() => setSidebarOpen(false)}
      />
    </SchemasContext.Provider>
  );
}

const s = StyleSheet.create({
  menuBtn:  { marginLeft: 4 },
  menuIcon: { color: C.headerText, fontSize: 20 },
});
