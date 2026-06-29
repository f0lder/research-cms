import { Block, PublicEntryResponse, MenuItem, Menu } from '@research-cms/shared-types';
import { API_URL, API_KEY } from './config';

const baseHeaders = { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' };

function authHeaders(token?: string) {
  return token ? { ...baseHeaders, Authorization: `Bearer ${token}` } : baseHeaders;
}

async function get<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders(token) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? `Request failed: ${res.status}`);
  return body as T;
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

export interface EntriesPage {
  items: PublicEntryResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface SchemaSummary {
  slug: string;
  name: string;
}

export function listSchemas(): Promise<SchemaSummary[]> {
  return get<SchemaSummary[]>('/public');
}

export function listEntries(slug: string, page = 1, limit = 20): Promise<EntriesPage> {
  return get<EntriesPage>(`/public/${slug}?page=${page}&limit=${limit}`);
}

export function getEntry(slug: string, id: string): Promise<PublicEntryResponse> {
  return get<PublicEntryResponse>(`/public/${slug}/${id}`);
}

export function listPages(): Promise<PublicEntryResponse[]> {
  return get<EntriesPage>('/public/page').then(r => r.items ?? []);
}

export async function getPage(pageSlug: string): Promise<PublicEntryResponse> {
  return get<PublicEntryResponse>(`/public/page/by-slug/${encodeURIComponent(pageSlug)}`);
}

export function getMedia(id: string): Promise<PublicEntryResponse> {
  return get<PublicEntryResponse>(`/public/media/${id}`);
}

export function getClientSettings(): Promise<Record<string, unknown>> {
  return get<Record<string, unknown>>('/public/settings');
}

export interface RenderedLayout {
  schemaSlug: string;
  entryId: string;
  blocks: Block[];
  data: Record<string, unknown>;
}

export function getRenderedLayout(schemaSlug: string, id: string): Promise<RenderedLayout> {
  return get<RenderedLayout>(`/public/layouts/${schemaSlug}/render/${id}`);
}

export interface MenuResponse {
  menu: Pick<Menu, 'name' | 'slug' | 'slot'> | null;
  items: MenuItem[];
}

export function getMenu(slot: string): Promise<MenuResponse> {
  return get<MenuResponse>(`/public/menus/${encodeURIComponent(slot)}`);
}
