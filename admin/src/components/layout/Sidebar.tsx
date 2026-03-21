'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAllSchemas } from '@/lib/utils';
import { ContentTypeDefinition } from '@research-cms/shared-types';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [schemas, setSchemas] = useState<ContentTypeDefinition[]>([]);
  const [contentOpen, setContentOpen] = useState(false);

  const isOnContentRoute =
    pathname.startsWith('/schemas/') &&
    !pathname.startsWith('/schemas/create') &&
    !pathname.startsWith('/schemas/edit');

  useEffect(() => {
    if (isOnContentRoute) setContentOpen(true);
  }, [isOnContentRoute]);

  useEffect(() => {
    getAllSchemas().then(({ data }) => {
      if (data) setSchemas(data);
    });
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const schemasActive =
    pathname === '/schemas' ||
    pathname.startsWith('/schemas/create') ||
    pathname.startsWith('/schemas/edit');
  const usersActive = pathname.startsWith('/users');

  const navItem = (active: boolean) =>
    `flex items-center px-5 py-2.5 text-sm cursor-pointer border-l-2 transition-colors duration-100 ${
      active
        ? 'border-white text-white bg-zinc-800'
        : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
    }`;

  return (
    <aside className="w-52 min-h-screen bg-zinc-900 text-white font-mono flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-zinc-800">
        <span className="font-bold text-sm tracking-wide">CMS Admin</span>
      </div>

      <nav className="flex-1 py-2">
        {/* Schemas */}
        <Link href="/schemas" className="block no-underline">
          <div className={navItem(schemasActive)}>Schemas</div>
        </Link>

        {/* Content — expandable */}
        <div>
          <button
            onClick={() => setContentOpen(o => !o)}
            className={`w-full flex items-center justify-between px-5 py-2.5 text-sm cursor-pointer border-l-2 transition-colors duration-100 bg-transparent ${
              isOnContentRoute
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <span>Content</span>
            <span className="text-[10px] text-zinc-600">{contentOpen ? '▲' : '▼'}</span>
          </button>

          {contentOpen && (
            <div className="bg-zinc-950">
              {schemas.length === 0 ? (
                <div className="px-5 py-2 pl-8 text-xs text-zinc-600">No post types yet</div>
              ) : (
                schemas.map(schema => {
                  const href = `/schemas/${schema.slug}`;
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link key={schema.slug} href={href} className="block no-underline">
                      <div
                        className={`px-5 py-2 pl-8 text-xs border-l-2 transition-colors duration-100 truncate ${
                          active
                            ? 'border-zinc-500 text-zinc-200 bg-zinc-800'
                            : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
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
      </nav>

      {/* User footer */}
      {user && (
        <div className="px-5 py-4 border-t border-zinc-800">
          <div className="text-xs text-white mb-0.5">{user.name}</div>
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-3">{user.role}</div>
          <button
            onClick={handleLogout}
            className="w-full py-1.5 text-xs text-zinc-500 border border-zinc-700 bg-transparent cursor-pointer hover:border-zinc-500 hover:text-zinc-300 transition-colors font-mono"
          >
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}
