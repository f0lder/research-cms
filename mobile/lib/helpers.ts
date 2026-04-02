import { PublicEntryResponse } from '@research-cms/shared-types';

export function entryTitle(entry: PublicEntryResponse): string {
  const titleBlock = entry.blocks.find(b => b.fieldName === 'title');
  if (titleBlock?.value && typeof titleBlock.value === 'string') return titleBlock.value;
  const first = entry.blocks.find(b => typeof b.value === 'string' && b.value);
  return first ? String(first.value).slice(0, 50) : `#${entry._id.slice(-6)}`;
}

export function entrySubtitle(entry: PublicEntryResponse): string | null {
  const sub = entry.blocks.find(
    b => b.fieldName !== 'title' && typeof b.value === 'string' && b.value
  );
  return sub ? String(sub.value).slice(0, 80) : null;
}
