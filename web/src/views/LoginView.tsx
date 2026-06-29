import { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { useEndUserAuth } from '@/contexts/AuthContext';

export default function LoginView() {
  const colors = useTheme();
  const { login } = useEndUserAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      window.location.hash = '#/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: '0 auto' }}>
      <h1 style={{ color: colors.primary, marginBottom: 20 }}>Log in</h1>
      {error && <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p style={{ fontSize: 13, color: colors.subText, marginTop: 16 }}>
        Need an account? <a href="#/register" style={{ color: colors.accent }}>Register</a>
      </p>
    </div>
  );
}

export function inputStyle(border: string): React.CSSProperties {
  return { padding: 10, borderRadius: 6, border: `1px solid ${border}`, fontSize: 14 };
}

export function buttonStyle(accent: string): React.CSSProperties {
  return { padding: 12, borderRadius: 6, border: 'none', background: accent, color: '#fff', fontWeight: 600, cursor: 'pointer' };
}
