import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTheme, useSchemasContext } from './_layout';

export default function DebugScreen() {
  const colors = useTheme();
  const { settings } = useSchemasContext();

  return (
    <ScrollView style={[s.container, { backgroundColor: colors.bg }]}>
      <Text style={[s.heading, { color: colors.text }]}>Debug</Text>

      <Text style={[s.section, { color: colors.text }]}>Settings</Text>
      <View style={[s.code, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[s.codeText, { color: colors.text }]}>
          {JSON.stringify(settings, null, 2)}
        </Text>
      </View>

      <Text style={[s.section, { color: colors.text }]}>Theme Colors</Text>
      {Object.entries(colors)
        .filter(([, v]) => typeof v === 'string')
        .map(([name, value]) => (
          <View key={name} style={[s.colorRow, { backgroundColor: value as string }]}>
            <Text style={[s.colorLabel, { color: '#fff', textShadowColor: '#000', textShadowRadius: 2 }]}>
              {name}
            </Text>
            <Text style={[s.colorValue, { color: '#fff', textShadowColor: '#000', textShadowRadius: 2 }]}>
              {value as string}
            </Text>
          </View>
        ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  section: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  code: { padding: 12, borderRadius: 6, borderWidth: 1 },
  codeText: { fontSize: 11, fontFamily: 'monospace' },
  colorRow: { padding: 12, marginBottom: 4, borderRadius: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  colorLabel: { fontSize: 13, fontWeight: '600' },
  colorValue: { fontSize: 11, fontFamily: 'monospace' },
});
