import { API_URL, API_KEY } from '@/lib/config';
import { PublicEntryResponse } from '@research-cms/shared-types';

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
