'use client';

import { blockRegistry } from '@research-cms/shared-types';
import { getBlockIcon } from '../../lib/blockIcons';
import { Text } from '@/components/ui';

/**
 * Panel to add new blocks to a page/layout.
 * Reads from the block registry and organizes by category.
 * Adding a new block type automatically makes it appear here.
 */
export function AddBlockPanel({
  onAdd,
}: {
  onAdd: (blockType: string) => void;
}) {
  const categories: Array<'static' | 'content' | 'layout'> = [
    'static',
    'content',
    'layout',
  ];

  return (
    <div className="flex flex-col gap-4">
      {categories.map(category => {
        const definitions = blockRegistry.getByCategory(category);

        if (definitions.length === 0) return null;

        return (
          <div key={category}>
            <Text variant="caption" color="secondary" className="uppercase tracking-wider font-bold mb-2">
              {category}
            </Text>
            <div className="grid grid-cols-3 gap-2">
              {definitions.map(def => {
                const Icon = getBlockIcon(def.type);
                return (
                  <button
                    key={def.type}
                    onClick={() => onAdd(def.type)}
                    className="flex flex-col items-center p-3 border-2 border-on-surface bg-surface hover:bg-surface-container hover:shadow-hard transition-all cursor-pointer"
                    title={def.description}
                  >
                    {Icon ? <Icon className="mb-1 text-on-surface w-6 h-6" /> : <span className="text-2xl mb-1">{def.icon}</span>}
                    <span className="text-caption text-on-surface text-center font-code leading-tight uppercase">
                      {def.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
