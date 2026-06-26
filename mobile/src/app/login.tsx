import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/src/app/_layout';
import { useEndUserAuth } from '@/lib/auth-context';

export default function LoginScreen() {
  const colors = useTheme();
  const { login } = useEndUserAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const s = StyleSheet.create({
    container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: colors.bg },
    title:     { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 20 },
    input:     { borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 12, marginBottom: 12, color: colors.text },
    error:     { color: '#ef4444', fontSize: 13, marginBottom: 12 },
    button:    { backgroundColor: colors.accent, borderRadius: 6, padding: 14, alignItems: 'center', marginTop: 4 },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    link:      { color: colors.accent, fontSize: 13, marginTop: 16, textAlign: 'center' },
  });

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/' as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Log in</Text>
      {error ? <Text style={s.error}>{error}</Text> : null}
      <TextInput
        style={s.input}
        placeholder="Email"
        placeholderTextColor={colors.metaText}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={s.input}
        placeholder="Password"
        placeholderTextColor={colors.metaText}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={s.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Log in</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/register' as never)}>
        <Text style={s.link}>Need an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}
