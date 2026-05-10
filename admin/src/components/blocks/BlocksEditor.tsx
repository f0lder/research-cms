'use client';
import { ReactNode, useState } from 'react';
import {
  DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block, blockRegistry } from '@research-cms/shared-types';
import { MdDelete, MdExpandMore, MdChevronRight, MdDragIndicator } from 'react-icons/md';
import { BlockConfigForm, AddBlockPanel, NestedBlocksEditor, ColumnsEditor } from '.';
import { Button, Heading, Text, TypeIcon } from '@/components/ui';
import { registerBuiltInBlocks } from '@research-cms/shared-types';

registerBuiltInBlocks(); // Ensure blocks are registered before any editor is rendered

function findBlockById(blocks: Block[], id: string): Block | null {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.type === 'row') {
      const columns = (block as any).columns ?? [];
      for (const col of columns) {
        const found = findBlockById(col.blocks ?? [], id);
        if (found) return found;
      }
    }
    if (['column', 'card'].includes(block.type)) {
      const found = findBlockById((block as any).blocks ?? [], id);
      if (found) return found;
    }
  }
  return null;
}

function updateBlockById(blocks: Block[], id: string, updatedBlock: Block | null): Block[] {
  return blocks.reduce((acc: Block[], block) => {
    if (block.id === id) {
      if (updatedBlock) acc.push(updatedBlock);
    } else {
      let newBlock = { ...block };
      if (block.type === 'row') {
        const columns = (block as any).columns ?? [];
        newBlock = {
          ...newBlock,
          columns: columns.map((col: any) => ({
            ...col,
            blocks: updateBlockById(col.blocks ?? [], id, updatedBlock)
          }))
        };
      } else if (['column', 'card'].includes(block.type)) {
        newBlock = {
          ...newBlock,
          blocks: updateBlockById((block as any).blocks ?? [], id, updatedBlock)
        };
      }
      acc.push(newBlock);
    }
    return acc;
  }, []);
}

/**
 * Reusable block editor component with inline nested block editing.
 * Container blocks (row, column, card) expand inline to show nested editor.
 * Used by both PageEditor and LayoutEditor to maintain consistent UI.
 */
export function BlocksEditor({
  blocks,
  onBlocksChange,
  onHeaderContent,
  schemaSlug,
  infoNote,
  clientId,
}: {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  onHeaderContent?: ReactNode; // Custom header content above the blocks
  schemaSlug?: string; // Optional: for layout templates, passes context schema
  infoNote?: ReactNode; // Optional: info message at bottom left
  clientId?: string; // Optional: scopes page-pickers to this client's pages
}) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [expandedBlockIds, setExpandedBlockIds] = useState<string[]>([]);
  const [showAddBlockPanel, setShowAddBlockPanel] = useState(false);
  
  const sensors = useSensors(useSensor(PointerSensor));

  const toggleExpand = (id: string) => {
    setExpandedBlockIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find indices by block ID
    const activeIndex = blocks.findIndex(b => b.id === active.id);
    const overIndex = blocks.findIndex(b => b.id === over.id);

    if (activeIndex === -1 || overIndex === -1) return;

    // Reorder blocks array
    const reordered = arrayMove(blocks, activeIndex, overIndex);

    // Update order field to match new position
    const withOrderUpdated = reordered.map((block, index) => ({
      ...block,
      order: index,
    }));

    onBlocksChange(withOrderUpdated);
  };

  const updateBlock = (id: string, updated: Block) => {
    onBlocksChange(updateBlockById(blocks, id, updated));
  };

  const removeBlock = (id: string) => {
    onBlocksChange(updateBlockById(blocks, id, null));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
    setExpandedBlockIds(prev => prev.filter(x => x !== id));
  };

  const addBlock = (type: string) => {
    const block = blockRegistry.getDefaultConfig(type);
    if (block) {
      const newBlock = { ...block, order: blocks.length };
      onBlocksChange([...blocks, newBlock]);
      setSelectedBlockId(newBlock.id);
    }
  };

  const selectedBlock = selectedBlockId ? findBlockById(blocks, selectedBlockId) : null;

  return (
    <div className="page flex flex-col h-screen overflow-hidden">
      {/* Header */}
      {onHeaderContent && (
        <div className="shrink-0 mb-6">
          {onHeaderContent}
        </div>
      )}

      {/* Main content with sidebar */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Main editing area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {blocks.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 overflow-y-auto pr-4">
                  {blocks.map((block, i) => (
                    <div key={block.id}>
                      <SortableBlockItem
                        block={block}
                        index={i}
                        isSelected={selectedBlockId === block.id}
                        isExpanded={expandedBlockIds.includes(block.id)}
                        onSelect={() => {
                          setSelectedBlockId(block.id);
                          if (['row', 'column', 'card'].includes(block.type) && !expandedBlockIds.includes(block.id)) {
                             toggleExpand(block.id);
                          }
                        }}
                        onToggleExpand={() => toggleExpand(block.id)}
                      />

                      {/* Inline nested editor for expanded container blocks */}
                      {expandedBlockIds.includes(block.id) && ['row', 'column', 'card'].includes(block.type) && (
                        <div className="ml-4 mt-2 mb-3 border-2 border-primary bg-surface-container">
                          {block.type === 'row' && (
                            <div className="p-3">
                              <ColumnsEditor
                                columns={(block as any).columns ?? []}
                                onChange={cols => {
                                  updateBlock(block.id, { ...block, columns: cols });
                                }}
                                onSelectNestedBlock={(blockId) => {
                                  setSelectedBlockId(blockId);
                                }}
                              />
                            </div>
                          )}
                          {(block.type === 'column' || block.type === 'card') && (
                            <div className="p-3">
                              <NestedBlocksEditor
                                blocks={(block as any).blocks ?? []}
                                onChange={nestedBlocks => {
                                  updateBlock(block.id, { ...block, blocks: nestedBlocks });
                                }}
                                label={block.type === 'column' ? 'Column Content' : 'Card Content'}
                                onSelectBlock={(nestedBlock) => {
                                  setSelectedBlockId(nestedBlock.id);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="p-6 border-2 border-dashed border-on-surface bg-surface-container text-center max-w-xs">
                <Text variant="body-sm" className="font-bold uppercase mb-2">No blocks yet</Text>
                <Text variant="caption" color="secondary">Click the button below to add a block</Text>
              </div>
            </div>
          )}

          {/* Add Block button - main area */}
          <div className="shrink-0 mt-4 mb-4">
            <Button
              onClick={() => setShowAddBlockPanel(!showAddBlockPanel)}
              variant="primary"
              size="md"
              className="w-full"
            >
              + Add Block
            </Button>
            {showAddBlockPanel && (
              <div className="mt-3 p-4 border-2 border-on-surface bg-surface-container">
                <AddBlockPanel
                  onAdd={(type) => {
                    addBlock(type);
                    setShowAddBlockPanel(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* Info note */}
          {infoNote && (
            <div className="shrink-0 mt-4 p-3 bg-surface-container border-2 border-on-surface">
              {infoNote}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-80 shrink-0 border-l-2 border-on-surface bg-surface-container flex flex-col overflow-hidden">
          {selectedBlock ? (
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <Heading level={4}>Block Settings</Heading>
                  <Text variant="code" color="secondary" className="mt-1">
                    {blockRegistry.get(selectedBlock.type)?.label ?? selectedBlock.type}
                  </Text>
                </div>
                <Button
                  onClick={() => removeBlock(selectedBlock.id)}
                  variant="destructive"
                  size="xs"
                  icon={<MdDelete size={14} />}
                  title="Delete block"
                >
                  Delete
                </Button>
              </div>
              <BlockConfigForm
                block={selectedBlock}
                onChange={b => updateBlock(selectedBlock.id, b)}
                schemaSlug={schemaSlug}
                clientId={clientId}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-4">
              <div>
                <Text variant="body-sm" color="secondary" className="font-bold uppercase mb-1">No block selected</Text>
                <Text variant="caption" color="secondary">Click a block to edit its settings</Text>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Individual sortable block item (for the list, not inline editing)
 */
function SortableBlockItem({
  block,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
}: {
  block: Block;
  index: number;
  isSelected: boolean;
  isExpanded?: boolean;
  onSelect: () => void;
  onToggleExpand?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const def = blockRegistry.get(block.type);
  const typeLabel = def?.label ?? 'Block';
  const isContainer = ['row', 'column', 'card'].includes(block.type);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={`border-2 cursor-pointer transition-all mb-3 ${isSelected
        ? 'border-primary bg-surface-container shadow-hard'
        : 'border-on-surface bg-surface hover:bg-surface-container'
        } ${isExpanded ? 'shadow-hard' : ''}`}
    >
      <div
        onClick={onSelect}
        className="flex items-center gap-3 px-3 py-2"
      >
        <button
          {...attributes}
          {...listeners}
          className="text-on-surface-variant hover:text-on-surface cursor-grab active:cursor-grabbing leading-none select-none shrink-0 flex items-center"
          aria-label="Drag to reorder"
          onClick={e => e.stopPropagation()}
        >
          <MdDragIndicator size={18} />
        </button>
        
        <div className="text-on-surface-variant shrink-0 flex items-center justify-center">
          <TypeIcon type={block.type} className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <Text variant="code" color="secondary" as="span" className="block uppercase tracking-wider font-bold">{typeLabel}</Text>
          {block && (block as any).config?.label && (
            <Text variant="body-sm" as="span" className="block truncate">{(block as any).config.label}</Text>
          )}
        </div>
        {isContainer && (
          <button onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }} className="text-on-surface-variant shrink-0 flex items-center hover:text-primary">
            {isExpanded ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
