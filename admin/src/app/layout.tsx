import './global.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { SchemaProvider } from '@/contexts/SchemaContext';
import { initializeAdmin } from '@/lib/admin-init';

// Initialize admin on startup
initializeAdmin();

export const metadata = {
  title: 'CMS Admin',
  description: 'Headless CMS Admin Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SchemaProvider>{children}</SchemaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
