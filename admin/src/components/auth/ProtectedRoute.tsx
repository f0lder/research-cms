'use client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '../skeletons';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If provided, user must have one of these roles. Others are redirected to /schemas. */
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Middleware handles redirects, just show sidebar skeleton and page skeleton while loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Skeleton className="w-64 min-h-screen" />
        <div className="flex-1 p-10">
          <Skeleton className="h-8 w-1/3 mb-6" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
        </div>
      </div>
    );
  }

  // Middleware guarantees user exists here, but check roles if specified
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <div className="p-10 font-mono text-sm text-zinc-400">Access denied.</div>;
  }

  return <>{children}</>;
}
