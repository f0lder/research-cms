'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If provided, user must have one of these roles. Others are redirected to /schemas. */
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/login'); return; }
    if (allowedRoles && !allowedRoles.includes(user.role)) router.push('/schemas');
  }, [user, isLoading, router, allowedRoles]);

  if (isLoading) return <div className="p-10 font-mono text-sm text-zinc-400">Loading…</div>;
  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
