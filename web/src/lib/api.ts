import { Block, PublicEntryResponse } from '@research-cms/shared-types';
import { API_URL, API_KEY } from './config';

const baseHeaders = { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: baseHeaders });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? `Request failed: ${res.status}`);
  return body as T;
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
