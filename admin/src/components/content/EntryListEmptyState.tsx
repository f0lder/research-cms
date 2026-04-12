import Link from 'next/link';

interface EmptyStateProps {
  tab: 'entries' | 'trash';
  slug: string;
}

export function EntryListEmptyState({ tab, slug }: EmptyStateProps) {
  const message = tab === 'trash' ? 'Trash is empty.' : 'No entries yet.';
  
  return (
    <div className="border-2 border-dashed border-zinc-200 p-16 text-center">
      <p className="text-zinc-400 text-sm mb-4">{message}</p>
      {tab === 'entries' && (
        <Link href={`/schemas/${slug}/content/create`}>
          <button className="btn-secondary">Create first entry</button>
        </Link>
      )}
    </div>
  );
}
