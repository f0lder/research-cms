'use client';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If provided, user must have one of these roles. Others are redirected to /schemas. */
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Middleware handles redirects, just show loading or render
  if (isLoading) {
    return <div className="p-10 font-mono text-sm text-zinc-400">Loading…</div>;
  }

  // Middleware guarantees user exists here, but check roles if specified
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <div className="p-10 font-mono text-sm text-zinc-400">Access denied.</div>;
  }

  return <>{children}</>;
}
