import { useEffect, useMemo, useState } from 'react';
import { Block, PublicEntryResponse } from '@research-cms/shared-types';
import { API_KEY } from '@/lib/config';
import { listPages, getPage, getClientSettings, listSchemas, SchemaSummary } from '@/lib/api';
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
    ])
      .then(([p, s, st]) => {
        if (cancelled) return;
        setPages(p);
        setSchemas(s.filter(x => x.slug !== 'page' && x.slug !== 'media'));
        setSettings(st);
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
      <div style={{ height: 4, background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)` }} />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif', color: colors.text }}>
        <Nav pages={pages} schemas={schemas} route={route} />
        <RouteContent route={route} pages={pages} schemas={schemas} />
      </main>
    </ThemeProvider>
  );
}

function RouteContent({
  route,
  pages,
  schemas,
}: {
  route: Route;
  pages: PublicEntryResponse[];
  schemas: SchemaSummary[];
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
    return <DebugView />;
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

function Nav({ pages, schemas, route }: { pages: PublicEntryResponse[]; schemas: SchemaSummary[]; route: Route }) {
  const colors = useTheme();
  if (pages.length === 0 && schemas.length === 0) return null;

  const linkStyle = (active: boolean): React.CSSProperties => ({
    color: active ? colors.primary : colors.subText,
    fontWeight: active ? 600 : 400,
    textDecoration: 'none',
    fontSize: 14,
    paddingBottom: 4,
    borderBottom: active ? `2px solid ${colors.primary}` : '2px solid transparent',
  });

  const activePageSlug = route.type === 'page' ? route.slug : null;
  const activeSchemaSlug = route.type === 'archive' ? route.slug : route.type === 'entry' ? route.slug : null;

  return (
    <nav
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
        paddingBottom: 12,
        borderBottom: `${colors.borderWidth}px solid ${colors.border}`,
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
