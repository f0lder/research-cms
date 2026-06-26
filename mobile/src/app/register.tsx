import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/src/app/_layout';
import { useEndUserAuth } from '@/lib/auth-context';

export default function RegisterScreen() {
  const colors = useTheme();
  const { register } = useEndUserAuth();
  const [name, setName] = useState('');
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
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      await register(email.trim(), password, name.trim());
      router.replace('/' as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Create an account</Text>
      {error ? <Text style={s.error}>{error}</Text> : null}
      <TextInput
        style={s.input}
        placeholder="Name"
        placeholderTextColor={colors.metaText}
        value={name}
        onChangeText={setName}
      />
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
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Register</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/login' as never)}>
        <Text style={s.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}
