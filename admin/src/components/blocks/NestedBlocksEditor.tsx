'use client';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block, blockRegistry } from '@research-cms/shared-types';
import { MdDragIndicator, MdDelete } from 'react-icons/md';
import { AddBlockPanel } from './AddBlockPanel';
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
  onSelectBlock?: (block: Block, index: number) => void;
}) {
  // No local selection state - let parent handle it
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onChange(arrayMove(blocks, Number(active.id), Number(over.id)));
  };

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const addBlock = (type: string) => {
    const block = blockRegistry.getDefaultConfig(type);
    if (block) {
      onChange([...blocks, block]);
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
          <div className="max-h-48 overflow-y-auto">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map((_, i) => i)} strategy={verticalListSortingStrategy}>
                <div className="divide-y-2 divide-on-surface">
                  {blocks.map((block, i) => (
                    <NestedBlockItem
                      key={i}
                      block={block}
                      index={i}
                      onSelect={() => onSelectBlock?.(block, i)}
                      onDelete={() => removeBlock(i)}
                    />
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
  onSelect,
  onDelete,
}: {
  block: Block;
  index: number;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: index });
  const def = blockRegistry.get(block.type);
  const typeLabel = def?.label ?? block.type;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="px-3 py-2 hover:bg-surface-container transition-colors group"
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
