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

export async function listEntries(slug: string): Promise<PublicEntryResponse[]> {
  const res = await get<{ items: PublicEntryResponse[] }>(`/public/${slug}`);
  return res.items;
}

export function getEntry(slug: string, id: string): Promise<PublicEntryResponse> {
  return get(`/public/${slug}/${id}`);
}
