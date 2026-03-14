import './global.css';
import { AuthProvider } from '../contexts/AuthContext';

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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
