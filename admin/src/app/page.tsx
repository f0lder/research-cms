'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SystemOverview from '@/components/dashboard/SystemOverview';

export default function HomePage() {
  // Middleware guarantees we're authenticated here
  return (
    <DashboardLayout>
      <SystemOverview />
    </DashboardLayout>
  );
}