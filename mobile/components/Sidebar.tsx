import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, SafeAreaView, StyleSheet } from 'react-native';
import { ClientPage } from '@research-cms/shared-types';
import { C } from '@/lib/theme';

type Schema = { slug: string; name: string };

interface Props {
  visible: boolean;
  schemas: Schema[];
  pages: ClientPage[];
  activeSlug: string | null;
  onSelect: (path: string) => void;
  onClose: () => void;
}

export function Sidebar({ visible, schemas, pages, activeSlug, onSelect, onClose }: Props) {
  // If the client has published pages configured, show those in the nav.
  // Otherwise fall back to the raw schema list.
  const showPages = pages.length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={s.scrim} onPress={onClose} />
      <View style={s.drawer}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={s.header}>
            <Text style={s.title}>{showPages ? 'Pages' : 'Content Types'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={s.close}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {showPages ? (
              pages.length === 0 ? (
                <Text style={s.empty}>No pages published yet.</Text>
              ) : (
                pages.map(page => {
                  const path = `/pages/${page.slug}`;
                  const active = activeSlug === page.slug;
                  return (
                    <TouchableOpacity
                      key={page._id}
                      style={[s.item, active && s.itemActive]}
                      onPress={() => onSelect(path)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[s.itemText, active && s.itemTextActive]}>{page.title}</Text>
                        {page.isHome && <Text style={s.homeTag}>home</Text>}
                      </View>
                      <Text style={s.itemSlug}>/{page.slug}</Text>
                    </TouchableOpacity>
                  );
                })
              )
            ) : (
              schemas.length === 0 ? (
                <Text style={s.empty}>No content types available.</Text>
              ) : (
                schemas.map(schema => {
                  const path = `/${schema.slug}`;
                  const active = activeSlug === schema.slug;
                  return (
                    <TouchableOpacity
                      key={schema.slug}
                      style={[s.item, active && s.itemActive]}
                      onPress={() => onSelect(path)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.itemText, active && s.itemTextActive]}>{schema.name}</Text>
                      <Text style={s.itemSlug}>/{schema.slug}</Text>
                    </TouchableOpacity>
                  );
                })
              )
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim:          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer:         { position: 'absolute', left: 0, top: 0, bottom: 0, width: 260, backgroundColor: C.drawerBg, elevation: 16 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  title:          { color: '#ffffff', fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  close:          { color: '#71717a', fontSize: 16 },
  empty:          { color: '#52525b', fontSize: 13, padding: 16, fontFamily: 'monospace' },
  item:           { paddingHorizontal: 16, paddingVertical: 12, borderLeftWidth: 2, borderLeftColor: 'transparent' },
  itemActive:     { borderLeftColor: '#ffffff', backgroundColor: C.drawerActive },
  itemText:       { color: C.drawerText, fontSize: 13, marginBottom: 2 },
  itemTextActive: { color: '#ffffff', fontWeight: '600' },
  itemSlug:       { color: '#52525b', fontSize: 10, fontFamily: 'monospace' },
  homeTag:        { fontSize: 9, color: '#d97706', fontFamily: 'monospace', backgroundColor: '#1c1208', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2 },
});
