import './global.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { SchemaProvider } from '@/contexts/SchemaContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { initializeAdmin } from '@/lib/admin-init';
import { Inter } from 'next/font/google';

// Font imports
const inter = Inter({
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
});

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
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
          <SettingsProvider>
            <SchemaProvider>{children}</SchemaProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
