import { PublicEntryResponse } from '@research-cms/shared-types';

export function entryTitle(entry: PublicEntryResponse): string {
  // Try to get title from entry data (API now returns raw data, not resolved blocks)
  const data = entry.data as Record<string, any>;
  if (data?.title && typeof data.title === 'string') return data.title;
  if (data?.name && typeof data.name === 'string') return data.name;

  // Fallback: try first string field from data
  const firstString = Object.values(data || {}).find(v => typeof v === 'string' && v);
  if (firstString) return String(firstString).slice(0, 50);

  return `#${entry._id?.slice(-6) ?? '?'}`;
}

export function entrySubtitle(entry: PublicEntryResponse): string | null {
  // Try to find a descriptive field from entry data
  const data = entry.data as Record<string, any>;

  // Look for description, excerpt, or second string field
  if (data?.description && typeof data.description === 'string') {
    return String(data.description).slice(0, 80);
  }
  if (data?.excerpt && typeof data.excerpt === 'string') {
    return String(data.excerpt).slice(0, 80);
  }

  // Find second string field (skip title/name)
  const strings = Object.entries(data || {})
    .filter(([k, v]) => typeof v === 'string' && v && k !== 'title' && k !== 'name')
    .map(([_, v]) => v as string);

  return strings.length > 0 ? strings[0].slice(0, 80) : null;
}
