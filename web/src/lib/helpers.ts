import { PublicEntryResponse } from '@research-cms/shared-types';

export function entryTitle(entry: PublicEntryResponse): string {
  const data = (entry.data ?? {}) as Record<string, unknown>;
  if (typeof data.title === 'string' && data.title) return data.title;
  if (typeof data.name === 'string' && data.name) return data.name;
  const firstString = Object.values(data).find(v => typeof v === 'string' && v) as string | undefined;
  if (firstString) return firstString.slice(0, 50);
  return `#${entry._id?.slice(-6) ?? '?'}`;
}

export function entrySubtitle(entry: PublicEntryResponse): string | null {
  const data = (entry.data ?? {}) as Record<string, unknown>;
  if (typeof data.description === 'string' && data.description) return data.description.slice(0, 80);
  if (typeof data.excerpt === 'string' && data.excerpt) return data.excerpt.slice(0, 80);
  const second = Object.entries(data)
    .filter(([k, v]) => typeof v === 'string' && v && k !== 'title' && k !== 'name')
    .map(([, v]) => v as string)[0];
  return second ? second.slice(0, 80) : null;
}
