'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/schemas');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 font-mono">
      <div className="w-full max-w-sm bg-white border border-zinc-200 p-10">
        <h1 className="text-xl font-bold text-zinc-900 mb-1">CMS Admin</h1>
        <p className="text-xs text-zinc-400 mb-8">Sign in to manage your content</p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="field-wrap">
            <label className="field-label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading}
              className="field-input"
            />
          </div>

          <div className="field-wrap">
            <label className="field-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
              className="field-input"
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-zinc-400 text-center mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="text-zinc-700 hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
