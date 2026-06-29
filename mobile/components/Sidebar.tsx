import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, SafeAreaView, StyleSheet, Linking } from 'react-native';
import { PageEntryResponse, MenuItem } from '@research-cms/shared-types';
import { useTheme } from '../src/app/_layout';
import { useEndUserAuth } from '../lib/auth-context';

type Schema = { slug: string; name: string };

interface Props {
  visible: boolean;
  schemas: Schema[];
  pages: PageEntryResponse[];
  headerMenuItems?: MenuItem[];
  homePageId?: string | null;
  activeSlug: string | null;
  onSelect: (path: string) => void;
  onClose: () => void;
}

export function Sidebar({ visible, schemas, pages, headerMenuItems = [], homePageId, activeSlug, onSelect, onClose }: Props) {

  const itemHref = (item: MenuItem): string => {
    switch (item.type) {
      case 'page':   return `/pages/${item.pageSlug ?? ''}`;
      case 'entry':  return `/${item.schemaSlug ?? ''}/${item.entryId ?? ''}`;
      case 'archive': return `/${item.archiveSchema ?? ''}`;
      case 'external': return item.url ?? '#';
    }
  };

  const handleMenuItemPress = (item: MenuItem) => {
    if (item.type === 'external' && item.url) {
      Linking.openURL(item.url);
      return;
    }
    onSelect(itemHref(item));
  };
  const colors = useTheme();
  const { user, isLoading, logout } = useEndUserAuth();

  const s = StyleSheet.create({
    scrim:            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
    drawer:           { position: 'absolute', left: 0, top: 0, bottom: 0, width: 260, backgroundColor: colors.drawerBg, elevation: 16 },
    header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
    title:            { color: '#ffffff', fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
    close:            { color: '#71717a', fontSize: 16 },
    empty:            { color: '#52525b', fontSize: 13, padding: 16, fontFamily: 'monospace' },
    sectionLabel:     { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    sectionLabelText: { color: '#71717a', fontSize: 10, fontWeight: '600', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5 },
    item:             { paddingHorizontal: 16, paddingVertical: 12, borderLeftWidth: 2, borderLeftColor: 'transparent' },
    itemActive:       { borderLeftColor: '#ffffff', backgroundColor: colors.drawerActive },
    itemText:         { color: colors.drawerText, fontSize: 13, marginBottom: 2 },
    itemTextActive:   { color: '#ffffff', fontWeight: '600' },
    itemSlug:         { color: '#52525b', fontSize: 10, fontFamily: 'monospace' },
    homeTag:          { fontSize: 9, color: '#d97706', fontFamily: 'monospace', backgroundColor: '#1c1208', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2 },
  });

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
            {/* Menu items section */}
            {headerMenuItems.length > 0 && (
              <>
                <View style={s.sectionLabel}>
                  <Text style={s.sectionLabelText}>Navigation</Text>
                </View>
                {headerMenuItems.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={s.item}
                    onPress={() => handleMenuItemPress(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.itemText}>{item.label}</Text>
                    <Text style={s.itemSlug}>
                      {item.type === 'page' ? `/${item.pageSlug}` :
                       item.type === 'entry' ? `/${item.schemaSlug}/${item.entryId}` :
                       item.type === 'archive' ? `/schema/${item.archiveSchema}` :
                       item.url}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

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
                        {homePageId === page._id && <Text style={s.homeTag}>home</Text>}
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

            <View style={s.sectionLabel}>
              <Text style={s.sectionLabelText}>System</Text>
            </View>
            <TouchableOpacity style={s.item} onPress={() => onSelect('/debug')} activeOpacity={0.7}>
              <Text style={s.itemText}>Debug</Text>
              <Text style={s.itemSlug}>/debug</Text>
            </TouchableOpacity>

            <View style={s.sectionLabel}>
              <Text style={s.sectionLabelText}>Account</Text>
            </View>
            {!isLoading && user ? (
              <>
                <View style={s.item}>
                  <Text style={s.itemText}>{user.name}</Text>
                  <Text style={s.itemSlug}>{user.email}</Text>
                </View>
                <TouchableOpacity style={s.item} onPress={logout} activeOpacity={0.7}>
                  <Text style={s.itemText}>Log out</Text>
                </TouchableOpacity>
              </>
            ) : !isLoading ? (
              <>
                <TouchableOpacity style={s.item} onPress={() => onSelect('/login')} activeOpacity={0.7}>
                  <Text style={s.itemText}>Log in</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.item} onPress={() => onSelect('/register')} activeOpacity={0.7}>
                  <Text style={s.itemText}>Register</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
