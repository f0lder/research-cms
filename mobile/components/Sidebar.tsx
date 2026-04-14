import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, SafeAreaView, StyleSheet } from 'react-native';
import { PageEntryResponse } from '@research-cms/shared-types';
import { C } from '@/lib/theme';

type Schema = { slug: string; name: string };

interface Props {
  visible: boolean;
  schemas: Schema[];
  pages: PageEntryResponse[];
  activeSlug: string | null;
  onSelect: (path: string) => void;
  onClose: () => void;
}

export function Sidebar({ visible, schemas, pages, activeSlug, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={s.scrim} onPress={onClose} />
      <View style={s.drawer}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={s.header}>
            <Text style={s.title}>Navigation</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={s.close}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {/* Pages section */}
            {pages.length > 0 && (
              <>
                <View style={s.sectionLabel}>
                  <Text style={s.sectionLabelText}>Pages</Text>
                </View>
                {pages.map(page => {
                  const path = `/pages/${page.data?.slug}`;
                  const active = activeSlug === page.data?.slug;
                  return (
                    <TouchableOpacity
                      key={page._id}
                      style={[s.item, active && s.itemActive]}
                      onPress={() => onSelect(path)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[s.itemText, active && s.itemTextActive]}>{page.data?.title}</Text>
                        {page.data?.isHome && <Text style={s.homeTag}>home</Text>}
                      </View>
                      <Text style={s.itemSlug}>/{page.data?.slug}</Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* Schemas section */}
            {schemas.length > 0 && (
              <>
                <View style={s.sectionLabel}>
                  <Text style={s.sectionLabelText}>Content Types</Text>
                </View>
                {schemas.map(schema => {
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
                })}
              </>
            )}

            {pages.length === 0 && schemas.length === 0 && (
              <Text style={s.empty}>No content available.</Text>
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
  sectionLabel:   { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  sectionLabelText: { color: '#71717a', fontSize: 10, fontWeight: '600', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5 },
  item:           { paddingHorizontal: 16, paddingVertical: 12, borderLeftWidth: 2, borderLeftColor: 'transparent' },
  itemActive:     { borderLeftColor: '#ffffff', backgroundColor: C.drawerActive },
  itemText:       { color: C.drawerText, fontSize: 13, marginBottom: 2 },
  itemTextActive: { color: '#ffffff', fontWeight: '600' },
  itemSlug:       { color: '#52525b', fontSize: 10, fontFamily: 'monospace' },
  homeTag:        { fontSize: 9, color: '#d97706', fontFamily: 'monospace', backgroundColor: '#1c1208', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2 },
});
