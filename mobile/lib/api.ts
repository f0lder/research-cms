import { API_URL, API_KEY } from '@/lib/config';
import { PublicEntryResponse, Block } from '@research-cms/shared-types';

export type { PublicEntryResponse };

const baseHeaders = { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' };

async function get<T>(path: string): Promise<T> {
  const url = `${API_URL}${path}`;
  console.log('[API] GET', url);

  try {
    const res = await fetch(url, { headers: baseHeaders });
    const body = await res.json().catch(() => ({}));
    console.log('[API] Response status:', res.status);
    console.log('[API] Response body:', body);

    if (!res.ok) {
      const msg = body.message ?? `Request failed: ${res.status}`;
      console.error('[API] Error:', msg);
      throw new Error(msg);
    }
    return body as T;
  } catch (e) {
    console.error('[API] Fetch error:', e);
    throw e;
  }
}

export function listSchemas(): Promise<{ slug: string; name: string }[]> {
  return get('/public');
}

export interface EntriesPage {
  items: PublicEntryResponse[];
  total: number;
  page: number;
  limit: number;
}

export function listEntries(slug: string, page = 1, limit = 20): Promise<EntriesPage> {
  return get<EntriesPage>(`/public/${slug}?page=${page}&limit=${limit}`);
}

export function getEntry(slug: string, id: string): Promise<PublicEntryResponse> {
  return get(`/public/${slug}/${id}`);
}

// Pages are entries in the 'page' schema
export async function listPages(): Promise<PublicEntryResponse[]> {
  try {
    console.log('[Pages] Fetching all pages...');
    const result = await get<{ items: PublicEntryResponse[] }>('/public/page');
    console.log('[Pages] Got', result.items?.length ?? 0, 'pages');
    return result.items || [];
  } catch (e) {
    console.error('[Pages] Error fetching pages:', e);
    return [];
  }
}

export async function getPage(pageSlug: string): Promise<PublicEntryResponse> {
  console.log('[Pages] Looking for page:', pageSlug);
  const pages = await listPages();
  console.log('[Pages] Searching through', pages.length, 'pages');

  // Try to find by slug first (preferred)
  const page = pages.find(p => {
    const slug = (p.data as any)?.slug;
    console.log('[Pages] Checking page', p._id, 'slug:', slug);
    return slug === pageSlug;
  });
  if (page) {
    console.log('[Pages] Found by slug:', page._id);
    return page;
  }

  // Fallback to ID lookup
  const pageById = pages.find(p => p._id === pageSlug);
  if (pageById) {
    console.log('[Pages] Found by ID:', pageById._id);
    return pageById;
  }

  console.error('[Pages] Page not found:', pageSlug);
  throw new Error(`Page not found: ${pageSlug}`);
}

export interface MediaEntry {
  _id: string;
  url: string;
  mimeType?: string;
  title?: string;
  caption?: string;
  altText?: string;
}

export function getLayout(schemaSlug: string): Promise<{ schemaId: string; schemaSlug: string; blocks: Block[] }> {
  return get(`/public/layouts/${schemaSlug}`);
}

export function getMedia(id: string): Promise<PublicEntryResponse> {
  return get<PublicEntryResponse>(`/public/media/${id}`);
}

