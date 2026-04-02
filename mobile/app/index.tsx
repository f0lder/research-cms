import { useEffect } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { API_KEY, API_URL } from '@/lib/config';
import { NoKeyNotice } from '@/components/NoKeyNotice';
import { useSchemasContext } from '@/app/_layout';
import { C, shared } from '@/lib/theme';

export default function IndexScreen() {
  const { schemas, loading, error } = useSchemasContext();

  useEffect(() => {
    if (!loading && schemas.length > 0) {
      router.replace(`/${schemas[0].slug}` as never);
    }
  }, [schemas, loading]);

  if (!API_KEY) return <NoKeyNotice />;

  if (loading) return <ActivityIndicator style={shared.center} color={C.accent} />;

  if (error) {
    return (
      <View style={shared.center}>
        <Text style={shared.errorText}>Could not reach API{'\n'}{API_URL}</Text>
        <Text style={s.detail}>{error}</Text>
      </View>
    );
  }

  if (schemas.length === 0) {
    return <Text style={shared.empty}>No content types found. Create one in the admin.</Text>;
  }

  return null;
}

const s = StyleSheet.create({
  detail: { fontSize: 11, color: C.metaText, fontFamily: 'monospace', marginTop: 8, textAlign: 'center', paddingHorizontal: 24 },
});
