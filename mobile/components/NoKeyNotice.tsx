import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../src/app/_layout';

export function NoKeyNotice() {
  const colors = useTheme();
  
  const s = StyleSheet.create({
    notice: { margin: 24, padding: 20, borderWidth: 1, borderColor: colors.border, borderRadius: 6 },
    title:  { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
    body:   { fontSize: 13, color: colors.subText, lineHeight: 20 },
    code:   { fontFamily: 'monospace', color: colors.text },
  });

  return (
    <View style={s.notice}>
      <Text style={s.title}>Client key not set</Text>
      <Text style={s.body}>
        Open <Text style={s.code}>mobile/lib/config.ts</Text> and paste your client key.{'\n'}
        Generate one in the admin under <Text style={s.code}>Clients</Text>.
      </Text>
    </View>
  );
}
