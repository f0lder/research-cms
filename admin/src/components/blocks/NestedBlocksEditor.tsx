'use client';
import { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block, blockRegistry } from '@research-cms/shared-types';
import { MdDragIndicator, MdDelete, MdExpandMore, MdChevronRight } from 'react-icons/md';
import { AddBlockPanel } from './AddBlockPanel';
import { ColumnsEditor } from './ColumnsEditor';
import { Text } from '@/components/ui';

/**
 * Nested blocks editor for container blocks (row, column, card).
 * Allows adding, removing, reordering, and configuring child blocks.
 * Selection bubbles up to parent via onSelectBlock callback (no sidebar for settings).
 */
export function NestedBlocksEditor({
  blocks,
  onChange,
  label = 'Nested Blocks',
  onSelectBlock,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  label?: string;
  onSelectBlock?: (block: Block) => void;
}) {
  const [expandedBlockIds, setExpandedBlockIds] = useState<string[]>([]);
  const sensors = useSensors(useSensor(PointerSensor));

  const toggleExpand = (id: string) => {
    setExpandedBlockIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onChange(arrayMove(blocks, Number(active.id), Number(over.id)));
  };

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const updateBlock = (index: number, updatedBlock: Block) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    onChange(newBlocks);
  };

  const addBlock = (type: string) => {
    const block = blockRegistry.getDefaultConfig(type);
    if (block) {
      onChange([...blocks, block]);
      if (onSelectBlock) {
        onSelectBlock(block);
      }
    }
  };

  return (
    <div>
      {blocks.length === 0 ? (
        <div className="p-3 text-center">
          <AddBlockPanel onAdd={addBlock} />
          <Text variant="caption" color="secondary" className="mt-2">No blocks yet</Text>
        </div>
      ) : (
        <div>
          {/* Block list - removable header */}
          {label && (
            <div className="px-2 py-1 bg-surface-container border-b-2 border-on-surface flex items-center justify-between">
              <Text variant="caption" color="secondary" as="span" className="font-bold uppercase tracking-wider font-code">
                {label}
              </Text>
              <Text variant="caption" color="secondary" as="span">
                {blocks.length}
              </Text>
            </div>
          )}
          <div className="max-h-96 overflow-y-auto">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map((_, i) => i)} strategy={verticalListSortingStrategy}>
                <div className="divide-y-2 divide-on-surface">
                  {blocks.map((block, i) => (
                    <div key={block.id || i}>
                      <NestedBlockItem
                        block={block}
                        index={i}
                        isExpanded={expandedBlockIds.includes(block.id)}
                        onSelect={() => {
                          onSelectBlock?.(block);
                          if (['row', 'column', 'card'].includes(block.type) && !expandedBlockIds.includes(block.id)) {
                             toggleExpand(block.id);
                          }
                        }}
                        onToggleExpand={() => toggleExpand(block.id)}
                        onDelete={() => removeBlock(i)}
                      />
                      {/* Inline nested editor for container blocks */}
                      {expandedBlockIds.includes(block.id) && ['row', 'column', 'card'].includes(block.type) && (
                        <div className="ml-6 mr-2 mt-2 mb-3 border-l-2 border-primary pl-3">
                          {block.type === 'row' && (
                            <ColumnsEditor
                              columns={(block as any).columns ?? []}
                              onChange={cols => updateBlock(i, { ...block, columns: cols })}
                              onSelectNestedBlock={(blockId) => onSelectBlock?.({ id: blockId } as Block)}
                            />
                          )}
                          {(block.type === 'column' || block.type === 'card') && (
                            <NestedBlocksEditor
                              blocks={(block as any).blocks ?? []}
                              onChange={nestedBlocks => updateBlock(i, { ...block, blocks: nestedBlocks })}
                              label={block.type === 'column' ? 'Column Content' : 'Card Content'}
                              onSelectBlock={onSelectBlock}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}

      {/* Add block button */}
      {blocks.length > 0 && (
        <div className="px-3 py-2 border-t-2 border-on-surface bg-surface-container">
          <AddBlockPanel onAdd={addBlock} />
        </div>
      )}
    </div>
  );
}

/**
 * Individual nested block item (compact list version)
 */
function NestedBlockItem({
  block,
  index,
  isExpanded,
  onSelect,
  onToggleExpand,
  onDelete,
}: {
  block: Block;
  index: number;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: index });
  const def = blockRegistry.get(block.type);
  const typeLabel = def?.label ?? block.type;
  const isContainer = ['row', 'column', 'card'].includes(block.type);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={`px-3 py-2 hover:bg-surface-container transition-colors group ${isExpanded ? 'bg-surface-container shadow-hard' : ''}`}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="text-on-surface-variant hover:text-on-surface cursor-grab active:cursor-grabbing leading-none shrink-0 flex items-center"
          onClick={e => e.stopPropagation()}
        >
          <MdDragIndicator size={16} />
        </button>
        <button
          onClick={onSelect}
          className="flex-1 text-left min-w-0 hover:underline cursor-pointer"
        >
          <Text variant="caption" as="span" className="block truncate font-code text-primary uppercase font-bold">{typeLabel}</Text>
          {(block as any).config?.label && (
            <Text variant="caption" color="secondary" as="span" className="block truncate">{(block as any).config.label}</Text>
          )}
        </button>
        
        {isContainer && (
          <button onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} className="text-on-surface-variant shrink-0 flex items-center hover:text-primary mr-2">
            {isExpanded ? <MdExpandMore size={16} /> : <MdChevronRight size={16} />}
          </button>
        )}

        <button
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-on-surface-variant hover:text-error leading-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center cursor-pointer"
          title="Delete block"
        >
          <MdDelete size={14} />
        </button>
      </div>
    </div>
  );
}
