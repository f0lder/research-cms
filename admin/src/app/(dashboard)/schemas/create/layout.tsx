import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CreateSchemaLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>;
}
