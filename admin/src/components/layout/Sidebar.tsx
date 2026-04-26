'use client';
import { Fragment, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSchemas } from '@/contexts/SchemaContext';
import { useSetting, useSettings } from '@/contexts/SettingsContext';
import { ListSkeleton, Skeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/Button';
import { Heading, Text } from '../ui';
import {
  LuLayoutDashboard,
  LuDatabase,
  LuFileText,
  LuUsers,
  LuKey,
  LuImage,
  LuScrollText,
  LuWebhook,
  LuSettings,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuLogOut,
} from 'react-icons/lu';
import type { IconType } from 'react-icons';

type NavLink = {
  href: string;
  label: string;
  icon: IconType;
  match?: (pathname: string) => boolean;
};

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Dashboard', icon: LuLayoutDashboard },
  {
    href: '/schemas',
    label: 'Schemas',
    icon: LuDatabase,
    match: (p) => p === '/schemas' || p.startsWith('/schemas/create') || p.startsWith('/schemas/edit'),
  },
  { href: '/users', label: 'Users', icon: LuUsers },
  { href: '/clients', label: 'Clients', icon: LuKey },
  { href: '/media', label: 'Media', icon: LuImage },
  { href: '/logs', label: 'Logs', icon: LuScrollText },
  { href: '/webhooks', label: 'Webhooks', icon: LuWebhook },
  { href: '/settings', label: 'Settings', icon: LuSettings },
];

const isActive = (link: NavLink, pathname: string) => {
  if (link.match) return link.match(pathname);
  return link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { schemas } = useSchemas();
  const siteName = useSetting<string>('site.name', 'AdminConsole');
  const { loading: settingsLoading } = useSettings();

  const [contentOpen, setContentOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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

  const navItem = (active: boolean) =>
    `flex items-center ${collapsed ? 'justify-center px-0' : 'px-4'} py-3 text-sm font-label uppercase tracking-widest cursor-pointer transition-all border-b-2 ${active
      ? 'bg-primary text-white border-b-2 border-black'
      : 'text-on-surface hover:bg-surface-container'
    }`;

  const labelClass = `whitespace-nowrap transition-all duration-200 overflow-hidden ${collapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-40 ml-3'
    }`;

  if (settingsLoading) {
    return (
      <aside className={`${collapsed ? 'w-16' : 'w-64'} min-h-screen bg-surface text-on-surface flex flex-col shrink-0 border-r-2 border-on-surface transition-[width] duration-300`}>
        <div className="px-6 py-6 border-b-2 border-on-surface">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24 mt-1" />
        </div>
        <ListSkeleton items={6} />
      </aside>
    );
  }

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} min-h-screen bg-surface text-on-surface flex flex-col shrink-0 border-r-2 border-on-surface transition-[width] duration-300 overflow-hidden`}>
      {/* Logo + collapse toggle */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-6'} py-6 border-b-2 border-on-surface`}>
        <div className={`min-w-0 transition-all duration-200 overflow-hidden ${collapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-45'}`}>
          <Heading className="text-label font-bold uppercase tracking-tighter truncate">{siteName}</Heading>
          <Text className="text-code text-on-surface-variant text-xs mt-1 truncate">Headless Management</Text>
        </div>
        <button
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="shrink-0 p-2 text-on-surface hover:bg-surface-container border-2 border-on-surface transition-all cursor-pointer"
        >
          {collapsed ? <LuPanelLeftOpen className="text-base" /> : <LuPanelLeftClose className="text-base" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {NAV_LINKS.map((link) => {
          const Icon = link.icon;
          return (
          <Fragment key={link.href}>
            <Link href={link.href} className="block no-underline" title={collapsed ? link.label : undefined}>
              <div className={navItem(isActive(link, pathname))}>
                <Icon className="text-base shrink-0" />
                <span className={labelClass}>{link.label}</span>
              </div>
            </Link>

            {/* Content expandable lives directly under Schemas */}
            {link.href === '/schemas' && (
              <div>
                <button
                  onClick={() => setContentOpen(o => !o)}
                  title={collapsed ? 'Content' : undefined}
                  className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-4'} py-3 text-sm font-label uppercase tracking-widest cursor-pointer border-b-2 transition-all ${isOnContentRoute
                      ? 'bg-primary text-white shadow-hard'
                      : 'border-on-surface text-on-surface hover:bg-surface-container'
                    }`}
                >
                  <span className="flex items-center min-w-0">
                    <LuFileText className="text-base shrink-0" />
                    <span className={labelClass}>Content</span>
                  </span>
                  {!collapsed && <span className="text-xs shrink-0">{contentOpen ? '▲' : '▼'}</span>}
                </button>

                {contentOpen && !collapsed && (
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
                              className={`px-6 py-2 text-code text-xs border-l-2 border-on-surface transition-all truncate ${active
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
            )}
          </Fragment>
          );
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div className={`${collapsed ? 'px-2' : 'px-6'} py-6 border-t-2 border-on-surface`}>
          <div className={`transition-all duration-200 overflow-hidden ${collapsed ? 'opacity-0 max-h-0 mb-0' : 'opacity-100 max-h-20 mb-4'}`}>
            <div className="text-label font-bold uppercase mb-1 truncate">{user.name}</div>
            <div className="text-code text-on-surface-variant text-xs uppercase tracking-widest truncate">{user.role}</div>
          </div>
          {collapsed ? (
            <button
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="w-full flex items-center justify-center p-2 text-on-surface hover:bg-surface-container border-2 border-on-surface transition-all cursor-pointer"
            >
              <LuLogOut className="text-base" />
            </button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={handleLogout}
              className="w-full"
            >
              Log out
            </Button>
          )}
        </div>
      )}
    </aside>
  );
}
