import { Button } from '@/components/ui/Button';

interface TabNavigationProps {
  tab: 'entries' | 'trash';
  entriesCount: number;
  trashCount: number;
  onTabChange: (tab: 'entries' | 'trash') => void;
}

export function TabNavigation({ tab, entriesCount, trashCount, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-4 mb-4">
      <Button
        type="button"
        variant={tab === 'entries' ? 'underline-active' : 'underline'}
        onClick={() => onTabChange('entries')}
      >
        Entries ({entriesCount})
      </Button>
      <Button
        type="button"
        variant={tab === 'trash' ? 'underline-active' : 'underline'}
        onClick={() => onTabChange('trash')}
      >
        Trash ({trashCount})
      </Button>
    </div>
  );
}
