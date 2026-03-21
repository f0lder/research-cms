import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../theme';

export function NoKeyNotice() {
  return (
    <View style={s.notice}>
      <Text style={s.title}>API key not set</Text>
      <Text style={s.body}>
        Open <Text style={s.code}>mobile/src/config.ts</Text> and paste your API key.{'\n'}
        Generate one in the admin under <Text style={s.code}>API Keys</Text>.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  notice: { margin: 24, padding: 20, borderWidth: 1, borderColor: C.border, borderRadius: 6 },
  title:  { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 8 },
  body:   { fontSize: 13, color: C.subText, lineHeight: 20 },
  code:   { fontFamily: 'monospace', color: C.text },
});
