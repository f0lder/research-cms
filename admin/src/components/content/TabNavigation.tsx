interface TabNavigationProps {
  tab: 'entries' | 'trash';
  entriesCount: number;
  trashCount: number;
  onTabChange: (tab: 'entries' | 'trash') => void;
}

export function TabNavigation({ tab, entriesCount, trashCount, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-2 mb-4 border-b border-zinc-200">
      <button
        onClick={() => onTabChange('entries')}
        className={`px-4 py-2 text-sm font-medium transition ${tab === 'entries' ? 'text-blue-600 border-b-2 border-blue-600 -mb-0.5' : 'text-zinc-600 hover:text-zinc-900'}`}
      >
        Entries ({entriesCount})
      </button>
      <button
        onClick={() => onTabChange('trash')}
        className={`px-4 py-2 text-sm font-medium transition ${tab === 'trash' ? 'text-blue-600 border-b-2 border-blue-600 -mb-0.5' : 'text-zinc-600 hover:text-zinc-900'}`}
      >
        Trash ({trashCount})
      </button>
    </div>
  );
}
