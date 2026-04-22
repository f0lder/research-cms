'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SchemasPage from './schemas/page';

export default function HomePage() {
  // Middleware guarantees we're authenticated here
  return (
    <DashboardLayout>
      <SchemasPage />
    </DashboardLayout>
  );
}