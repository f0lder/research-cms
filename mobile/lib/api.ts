import { API_URL, API_KEY } from '@/lib/config';
import { PublicEntryResponse, PageEntryResponse } from '@research-cms/shared-types';

export type { PublicEntryResponse, PageEntryResponse };

const baseHeaders = { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: baseHeaders });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
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

export async function listPages(): Promise<PageEntryResponse[]> {
  return get<PageEntryResponse[]>('/public/pages');
}

export async function getPage(slug: string): Promise<PageEntryResponse> {
  return get<PageEntryResponse>(`/public/pages/${slug}`);
}

export interface MediaEntry {
  _id: string;
  url: string;
  mimeType?: string;
  title?: string;
  caption?: string;
  altText?: string;
}

export function getMedia(id: string): Promise<MediaEntry> {
  return get<MediaEntry>(`/public/media/${id}`);
}

