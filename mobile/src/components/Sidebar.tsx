import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, SafeAreaView, StyleSheet } from 'react-native';
import { Schema } from '../types';
import { C } from '../theme';

interface Props {
  schemas: Schema[];
  activeSlug: string | null;
  onSelect: (s: Schema) => void;
  onClose: () => void;
}

export function Sidebar({ schemas, activeSlug, onSelect, onClose }: Props) {
  return (
    <Modal visible transparent animationType="fade">
      <Pressable style={s.scrim} onPress={onClose} />
      <View style={s.drawer}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={s.header}>
            <Text style={s.title}>Content Types</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={s.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            {schemas.length === 0 ? (
              <Text style={s.empty}>No content types available.</Text>
            ) : (
              schemas.map(schema => (
                <TouchableOpacity
                  key={schema.slug}
                  style={[s.item, activeSlug === schema.slug && s.itemActive]}
                  onPress={() => { onSelect(schema); onClose(); }}
                  activeOpacity={0.7}
                >
                  <Text style={[s.itemText, activeSlug === schema.slug && s.itemTextActive]}>
                    {schema.name}
                  </Text>
                  <Text style={s.itemSlug}>/{schema.slug}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 260,
    backgroundColor: C.drawerBg, elevation: 16,
    boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
  } as never,
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  title:        { color: '#ffffff', fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  close:        { color: '#71717a', fontSize: 16 },
  empty:        { color: '#52525b', fontSize: 13, padding: 16, fontFamily: 'monospace' },
  item:         { paddingHorizontal: 16, paddingVertical: 12, borderLeftWidth: 2, borderLeftColor: 'transparent' },
  itemActive:   { borderLeftColor: '#ffffff', backgroundColor: C.drawerActive },
  itemText:     { color: C.drawerText, fontSize: 13, marginBottom: 2 },
  itemTextActive: { color: '#ffffff', fontWeight: '600' },
  itemSlug:     { color: '#52525b', fontSize: 10, fontFamily: 'monospace' },
});
