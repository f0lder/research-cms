import { useEffect, useMemo, useState } from 'react';
import { Block, PublicEntryResponse, MenuItem } from '@research-cms/shared-types';
import { API_KEY } from '@/lib/config';
import { listPages, getPage, getClientSettings, listSchemas, getMenu, getMedia, SchemaSummary } from '@/lib/api';
import { ThemeProvider, createColors, useTheme, applyThemeVars } from '@/lib/theme';
import { BlockRenderer } from '@/components/BlockRenderer';
import ArchiveView from '@/views/ArchiveView';
import EntryView from '@/views/EntryView';
import DebugView from '@/views/DebugView';

type Route =
  | { type: 'home' }
  | { type: 'page'; slug: string }
  | { type: 'archive'; slug: string }
  | { type: 'entry'; slug: string; id: string }
  | { type: 'debug' };

function parseRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
  if (!hash) return { type: 'home' };
  const segments = hash.split('/').filter(Boolean);
  if (segments[0] === 'schema' && segments[1]) {
    return { type: 'archive', slug: decodeURIComponent(segments[1]) };
  }
  if (segments[0] === 'debug') {
    return { type: 'debug' };
  }
  if (segments.length >= 2) {
    return { type: 'entry', slug: decodeURIComponent(segments[0]), id: decodeURIComponent(segments[1]) };
  }
  return { type: 'page', slug: decodeURIComponent(segments[0]) };
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseRoute());
  const [pages, setPages] = useState<PublicEntryResponse[]>([]);
  const [schemas, setSchemas] = useState<SchemaSummary[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [footerItems, setFooterItems] = useState<MenuItem[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    const onHash = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!API_KEY) {
      setBootstrapError('No API key configured. Set VITE_API_KEY in web/.env');
      setBootstrapLoading(false);
      return;
    }

    let cancelled = false;
    Promise.all([
      listPages().catch(() => [] as PublicEntryResponse[]),
      listSchemas().catch(() => [] as SchemaSummary[]),
      getClientSettings()
        .then((res) => {
          console.log('[Theme] Loaded settings:', res);
          return res;
        })
        .catch((e) => {
          console.error('[Theme] Failed to load settings:', e);
          return {} as Record<string, unknown>;
        }),
      getMenu('header')
        .then(r => r.items)
        .catch(() => [] as MenuItem[]),
      getMenu('footer')
        .then(r => r.items)
        .catch(() => [] as MenuItem[]),
    ])
      .then(([p, s, st, mi, fi]) => {
        if (cancelled) return;
        setPages(p);
        setSchemas(s.filter(x => x.slug !== 'page' && x.slug !== 'media'));
        setSettings(st);
        if (mi.length > 0) setMenuItems(mi);
        if (fi.length > 0) setFooterItems(fi);
        const logoId = st['client.theme.logo'] as string | undefined;
        if (logoId) {
          getMedia(logoId).then(m => !cancelled && setLogoUrl((m.data?.url as string) ?? '')).catch(() => {});
        }
      })
      .catch(e => !cancelled && setBootstrapError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => !cancelled && setBootstrapLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  // On home route, redirect to the configured home page (or first page)
  useEffect(() => {
    if (route.type !== 'home' || bootstrapLoading || pages.length === 0) return;
    const homeId = settings['client.homePage'] as string | undefined;
    const home = (homeId && pages.find(p => p._id === homeId)) || pages[0];
    const homeSlug = home?.data?.slug as string | undefined;
    if (homeSlug) window.location.hash = `#/${homeSlug}`;
  }, [route.type, bootstrapLoading, pages, settings]);

  const colors = useMemo(() => createColors(settings), [settings]);

  // Apply page background + text color globally
  useEffect(() => {
    document.body.style.background = colors.bg;
    document.body.style.color = colors.text;
    document.body.style.margin = '0';
    applyThemeVars(colors);
  }, [colors]);

  if (bootstrapLoading) return <Centered>Loading…</Centered>;
  if (bootstrapError) return <Centered><span style={{ color: '#dc2626' }}>{bootstrapError}</span></Centered>;

  return (
    <ThemeProvider value={colors}>
      <header style={{ background: colors.headerBg }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)` }} />
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 24 }}>
          {logoUrl && <a href="#/"><img src={logoUrl} alt="Logo" style={{ height: 32, width: 'auto', cursor: 'pointer' }} /></a>}
          <Nav pages={pages} schemas={schemas} route={route} menuItems={menuItems} />
        </div>
      </header>
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif', color: colors.text }}>
        <RouteContent route={route} pages={pages} schemas={schemas} settings={settings} />
      </main>
      <Footer footerItems={footerItems} colors={colors} />
    </ThemeProvider>
  );
}

function RouteContent({
  route,
  pages,
  schemas,
  settings,
}: {
  route: Route;
  pages: PublicEntryResponse[];
  schemas: SchemaSummary[];
  settings: Record<string, unknown>;
}) {
  if (route.type === 'home') {
    if (pages.length === 0 && schemas.length === 0) {
      return <Centered>No content available. Create a page or schema in the admin.</Centered>;
    }
    return <Centered>Redirecting…</Centered>;
  }

  if (route.type === 'archive') {
    const name = schemas.find(s => s.slug === route.slug)?.name ?? route.slug;
    return <ArchiveView slug={route.slug} schemaName={name} />;
  }

  if (route.type === 'entry') {
    return <EntryView slug={route.slug} id={route.id} />;
  }

  if (route.type === 'debug') {
    return <DebugView settings={settings} />;
  }

  // 'page'
  return <PageView slug={route.slug} />;
}

function PageView({ slug }: { slug: string }) {
  const colors = useTheme();
  const [page, setPage] = useState<PublicEntryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPage(slug)
      .then(p => !cancelled && setPage(p))
      .catch(e => !cancelled && setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <p style={{ color: colors.subText }}>Loading…</p>;
  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>;
  if (!page) return <p style={{ color: colors.subText }}>Page not found.</p>;

  const blocks = ((page.data?.blocks as Block[] | undefined) ?? []) as Block[];

  return (
    <>
      {blocks.map((b, i) => (
        <BlockRenderer key={i} block={b} entryData={page.data as Record<string, unknown>} />
      ))}
    </>
  );
}

function Nav({ pages, schemas, route, menuItems }: { pages: PublicEntryResponse[]; schemas: SchemaSummary[]; route: Route; menuItems: MenuItem[] }) {
  const colors = useTheme();

  const linkStyle = (active: boolean): React.CSSProperties => ({
    color: active ? colors.accent : colors.headerTextColor,
    fontWeight: active ? 600 : 400,
    textDecoration: 'none',
    fontSize: 14,
    paddingBottom: 4,
    borderBottom: active ? `2px solid ${colors.accent}` : '2px solid transparent',
  });

  const isActive = (item: MenuItem): boolean => {
    switch (item.type) {
      case 'page':   return route.type === 'page' && route.slug === item.pageSlug;
      case 'archive': return route.type === 'archive' && route.slug === item.archiveSchema;
      case 'entry':  return route.type === 'entry' && route.slug === item.schemaSlug && route.id === item.entryId;
      case 'external': return false;
    }
  };

  const itemHref = (item: MenuItem): string => {
    switch (item.type) {
      case 'page':   return `#/${item.pageSlug ?? ''}`;
      case 'entry':  return `#/${item.schemaSlug ?? ''}/${item.entryId ?? ''}`;
      case 'archive': return `#/schema/${item.archiveSchema ?? ''}`;
      case 'external': return item.url ?? '#';
    }
  };

  const itemTarget = (item: MenuItem): string | undefined =>
    item.type === 'external' ? '_blank' : undefined;

  // If a header menu exists with items, render those
  if (menuItems.length > 0) {
    return (
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          padding: '12px 0',
          alignItems: 'center',
        }}
      >
        {menuItems.map(item => (
          <a
            key={item.id}
            href={itemHref(item)}
            target={itemTarget(item)}
            rel={item.type === 'external' ? 'noopener noreferrer' : undefined}
            style={linkStyle(isActive(item))}
          >
            {item.label}
          </a>
        ))}
      </nav>
    );
  }

  // Fallback: render pages + schemas as before
  if (pages.length === 0 && schemas.length === 0) return null;

  const activePageSlug = route.type === 'page' ? route.slug : null;
  const activeSchemaSlug = route.type === 'archive' ? route.slug : route.type === 'entry' ? route.slug : null;

  return (
    <nav
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        padding: '12px 0',
        alignItems: 'center',
      }}
    >
      {pages.map(p => {
        const slug = p.data?.slug as string;
        const title = (p.data?.title as string) ?? slug;
        return (
          <a key={p._id} href={`#/${slug}`} style={linkStyle(slug === activePageSlug)}>
            {title}
          </a>
        );
      })}

      {pages.length > 0 && schemas.length > 0 && (
        <span style={{ color: colors.metaText, fontSize: 14 }}>·</span>
      )}

      {schemas.map(s => (
        <a key={s.slug} href={`#/schema/${s.slug}`} style={linkStyle(s.slug === activeSchemaSlug)}>
          {s.name}
        </a>
      ))}
    </nav>
  );
}

function Footer({ footerItems, colors }: { footerItems: MenuItem[]; colors: ReturnType<typeof createColors> }) {
  if (footerItems.length === 0) return null;

  const linkStyle: React.CSSProperties = {
    color: colors.footerTextColor,
    textDecoration: 'none',
    fontSize: 14,
    opacity: 0.85,
  };

  const itemHref = (item: MenuItem): string => {
    switch (item.type) {
      case 'page':   return `#/${item.pageSlug ?? ''}`;
      case 'entry':  return `#/${item.schemaSlug ?? ''}/${item.entryId ?? ''}`;
      case 'archive': return `#/schema/${item.archiveSchema ?? ''}`;
      case 'external': return item.url ?? '#';
    }
  };

  return (
    <footer style={{ background: colors.footerBg, padding: '32px 16px', marginTop: 48 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
        {footerItems.map(item => (
          <a
            key={item.id}
            href={itemHref(item)}
            target={item.type === 'external' ? '_blank' : undefined}
            rel={item.type === 'external' ? 'noopener noreferrer' : undefined}
            style={linkStyle}
          >
            {item.label}
          </a>
        ))}
      </div>
    </footer>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'system-ui, sans-serif',
        color: '#475569',
      }}
    >
      {children}
    </div>
  );
}
