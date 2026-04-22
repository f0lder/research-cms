'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSchemas } from '@/contexts/SchemaContext';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { Button } from '@/components/ui/Button';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { schemas } = useSchemas();

  const [contentOpen, setContentOpen] = useState(false);

  const isOnContentRoute =
    pathname.startsWith('/schemas/') &&
    !pathname.startsWith('/schemas/create') &&
    !pathname.startsWith('/schemas/edit');

  useEffect(() => {
    if (isOnContentRoute) setContentOpen(true);
  }, [isOnContentRoute]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const schemasActive =
    pathname === '/schemas' ||
    pathname.startsWith('/schemas/create') ||
    pathname.startsWith('/schemas/edit');
  const dashboardActive = pathname === '/';
  const usersActive = pathname.startsWith('/users');
  const clientsActive = pathname.startsWith('/clients');
  const mediaActive = pathname.startsWith('/media');
  const logsActive = pathname.startsWith('/logs');
  const webhooksActive = pathname.startsWith('/webhooks');

  const navItem = (active: boolean) =>
    `flex items-center px-4 py-3 text-sm font-label uppercase tracking-widest cursor-pointer border-b-2 border-on-surface transition-all ${
      active
        ? 'bg-primary text-white shadow-hard'
        : 'border-on-surface text-on-surface hover:bg-surface-container'
    }`;

  return (
    <aside className="w-64 min-h-screen bg-surface text-on-surface flex flex-col shrink-0 border-r-2 border-on-surface">
      {/* Logo */}
      <div className="px-6 py-6 border-b-2 border-on-surface">
        <h2 className="text-label font-bold uppercase tracking-tighter">AdminConsole</h2>
        <p className="text-code text-on-surface-variant text-xs mt-1">Headless Management</p>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {/* Dashboard */}
        <Link href="/" className="block no-underline">
          <div className={navItem(dashboardActive)}>Dashboard</div>
        </Link>

        {/* Schemas */}
        <Link href="/schemas" className="block no-underline">
          <div className={navItem(schemasActive)}>Schemas</div>
        </Link>

        {/* Content — expandable */}
        <div>
          <button
            onClick={() => setContentOpen(o => !o)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-label uppercase tracking-widest cursor-pointer border-b-2 transition-all ${
              isOnContentRoute
                ? 'bg-primary text-white shadow-hard'
                : 'border-on-surface text-on-surface hover:bg-surface-container'
            }`}
          >
            <span>Content</span>
            <span className="text-xs">{contentOpen ? '▲' : '▼'}</span>
          </button>

          {contentOpen && (
            <div className="bg-surface-container-low border-b-2 border-on-surface">
              {schemas.length === 0 ? (
                <div className="px-6 py-2 text-caption text-on-surface-variant">No post types yet</div>
              ) : (
                schemas.map(schema => {
                  const href = `/schemas/${schema.slug}`;
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link key={schema.slug} href={href} className="block no-underline">
                      <div
                        className={`px-6 py-2 text-code text-xs border-l-2 border-on-surface transition-all truncate ${
                          active
                            ? 'bg-surface-container text-on-surface font-semibold'
                            : 'text-on-surface-variant hover:text-on-surface hover:bg-white'
                        }`}
                      >
                        {schema.name}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Users */}
        <Link href="/users" className="block no-underline">
          <div className={navItem(usersActive)}>Users</div>
        </Link>

        {/* Clients */}
        <Link href="/clients" className="block no-underline">
          <div className={navItem(clientsActive)}>Clients</div>
        </Link>

        {/* Media */}
        <Link href="/media" className="block no-underline">
          <div className={navItem(mediaActive)}>Media</div>
        </Link>

        {/* Logs */}
        <Link href="/logs" className="block no-underline">
          <div className={navItem(logsActive)}>Logs</div>
        </Link>

        {/* Webhooks */}
        <Link href="/webhooks" className="block no-underline">
          <div className={navItem(webhooksActive)}>Webhooks</div>
        </Link>
      </nav>

      {/* User footer */}
      {user && (
        <div className="px-6 py-6 border-t-2 border-on-surface">
          <div className="text-label font-bold uppercase mb-1">{user.name}</div>
          <div className="text-code text-on-surface-variant text-xs uppercase tracking-widest mb-4">{user.role}</div>
          <Button
            variant="secondary"
            size="md"
            onClick={handleLogout}
            className="w-full"
          >
            Log out
          </Button>
        </div>
      )}
    </aside>
  );
}
