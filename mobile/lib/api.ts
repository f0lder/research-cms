import { API_URL, API_KEY } from '@/lib/config';
import { PublicEntryResponse, Block, MenuItem } from '@research-cms/shared-types';

export type { PublicEntryResponse };

const baseHeaders = { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' };

function authHeaders(token?: string) {
  return token ? { ...baseHeaders, Authorization: `Bearer ${token}` } : baseHeaders;
}

async function get<T>(path: string, token?: string): Promise<T> {
  const url = `${API_URL}${path}`;

  try {
    const res = await fetch(url, { headers: authHeaders(token) });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = body.message ?? `Request failed: ${res.status}`;
      throw new Error(msg);
    }
    return body as T;
  } catch (e) {
    throw e;
  }
}

async function post<T>(path: string, data: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? `Request failed: ${res.status}`);
  return body as T;
}

export interface EndUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  user: EndUser;
  token: string;
}

export function registerUser(email: string, password: string, name: string): Promise<AuthResponse> {
  return post<AuthResponse>('/public/auth/register', { email, password, name });
}

export function loginUser(email: string, password: string): Promise<AuthResponse> {
  return post<AuthResponse>('/public/auth/login', { email, password });
}

export function getCurrentUser(token: string): Promise<EndUser> {
  return get<EndUser>('/public/auth/me', token);
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
    const result = await get<{ items: PublicEntryResponse[] }>('/public/page');
    return result.items || [];
  } catch (e) {
    console.error('[Pages] Error fetching pages:', e);
    return [];
  }
}

export async function getPage(pageSlug: string): Promise<PublicEntryResponse> {
  try {
    return await get<PublicEntryResponse>(`/public/page/by-slug/${encodeURIComponent(pageSlug)}`);
  } catch {
    // Fallback for callers that pass a Mongo _id rather than a slug
    return await get<PublicEntryResponse>(`/public/page/${encodeURIComponent(pageSlug)}`);
  }
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

export function getRenderedLayout(schemaSlug: string, id: string): Promise<{ schemaSlug: string; entryId: string; blocks: Block[]; data: Record<string, unknown> }> {
  return get(`/public/layouts/${schemaSlug}/render/${id}`);
}

export function getMedia(id: string): Promise<PublicEntryResponse> {
  return get<PublicEntryResponse>(`/public/media/${id}`);
}

export interface MenuResponse {
  menu: { name: string; slug: string; slot: string } | null;
  items: MenuItem[];
}

export function getMenu(slot: string): Promise<MenuResponse> {
  return get<MenuResponse>(`/public/menus/${encodeURIComponent(slot)}`);
}

/** Fetch the client-scoped public settings (auto-resolved from the API key). */
export function getClientSettings(): Promise<Record<string, unknown>> {
  return get<Record<string, unknown>>('/public/settings');
}

