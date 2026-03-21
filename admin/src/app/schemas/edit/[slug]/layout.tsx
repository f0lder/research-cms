import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function EditSchemaLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>;
}
