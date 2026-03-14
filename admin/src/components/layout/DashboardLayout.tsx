import ProtectedRoute from '../auth/ProtectedRoute';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-zinc-50">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
