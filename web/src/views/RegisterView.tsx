import { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { useEndUserAuth } from '@/contexts/AuthContext';
import { inputStyle, buttonStyle } from './LoginView';

export default function RegisterView() {
  const colors = useTheme();
  const { register } = useEndUserAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      await register(email.trim(), password, name.trim());
      window.location.hash = '#/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: '0 auto' }}>
      <h1 style={{ color: colors.primary, marginBottom: 20 }}>Create an account</h1>
      {error && <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={inputStyle(colors.border)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={inputStyle(colors.border)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={inputStyle(colors.border)}
        />
        <button type="submit" disabled={submitting} style={buttonStyle(colors.accent)}>
          {submitting ? 'Registering…' : 'Register'}
        </button>
      </form>
      <p style={{ fontSize: 13, color: colors.subText, marginTop: 16 }}>
        Already have an account? <a href="#/login" style={{ color: colors.accent }}>Log in</a>
      </p>
    </div>
  );
}
