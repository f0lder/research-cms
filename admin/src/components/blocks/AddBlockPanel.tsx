'use client';

import { blockRegistry } from '@research-cms/shared-types';
import { getBlockIcon } from '../../lib/blockIcons';

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
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">
              {category}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {definitions.map(def => {
                const Icon = getBlockIcon(def.type);
                return (
                  <button
                    key={def.type}
                    onClick={() => onAdd(def.type)}
                    className="flex flex-col items-center p-3 border border-zinc-200 rounded bg-white hover:bg-zinc-50 hover:border-zinc-400 transition-colors"
                    title={def.description}
                  >
                    {Icon ? <Icon className="mb-1 text-zinc-700 w-6 h-6" /> : <span className="text-2xl mb-1">{def.icon}</span>}
                    <span className="text-[10px] text-zinc-600 text-center font-mono leading-tight">
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
