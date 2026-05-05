'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button, TextField, Heading, Text, Container } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await register(email, password, name);
      // Middleware now handles auth check before rendering /schemas
      // No delay needed since we've already ensured the auth cookie is set
      showToast('Account created successfully', 'success');
      router.push('/schemas');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Container size="sm" className="bg-surface border-2 border-on-surface p-10">
        <Heading level={1} className="mb-2">CMS Admin</Heading>
        <Text variant="caption" color="secondary" className="mb-8">Create an account</Text>

        {error && <div className="alert-error mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Name"
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={isLoading}
          />

          <TextField
            label="Email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isLoading}
          />

          <TextField
            label="Password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isLoading}
          />

          <Button type="submit" disabled={isLoading} variant="primary" size="md" className="w-full mt-2">
            {isLoading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <Text variant="caption" color="secondary" className="text-center mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-bold">Sign in</Link>
        </Text>
      </Container>
    </div>
  );
}
