'use client';
import { ReactNode, useState } from 'react';
import {
  DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block, blockRegistry, ColumnBlock } from '@research-cms/shared-types';
import { MdDelete, MdExpandMore, MdChevronRight, MdDragIndicator } from 'react-icons/md';
import { BlockConfigForm, AddBlockPanel, NestedBlocksEditor, ColumnsEditor } from '.';
import { Button, Heading, Text } from '@/components/ui';

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
}: {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  onHeaderContent?: ReactNode; // Custom header content above the blocks
  schemaSlug?: string; // Optional: for layout templates, passes context schema
  infoNote?: ReactNode; // Optional: info message at bottom left
}) {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [expandedBlockIndex, setExpandedBlockIndex] = useState<number | null>(null);
  const [showAddBlockPanel, setShowAddBlockPanel] = useState(false);
  const [selectedNestedBlock, setSelectedNestedBlock] = useState<{
    blockId: string;
    parentIndex: number;
    parentType: 'row' | 'column' | 'card';
    nestedIndex: number;
  } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

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

  const updateBlock = (index: number, updated: Block) => {
    onBlocksChange(blocks.map((b, i) => i === index ? updated : b));
  };

  const removeBlock = (index: number) => {
    onBlocksChange(blocks.filter((_, i) => i !== index));
    if (selectedBlockIndex === index) {
      setSelectedBlockIndex(null);
    } else if (selectedBlockIndex !== null && selectedBlockIndex > index) {
      setSelectedBlockIndex(selectedBlockIndex - 1);
    }
    if (expandedBlockIndex === index) {
      setExpandedBlockIndex(null);
    }
  };

  const addBlock = (type: string) => {
    const block = blockRegistry.getDefaultConfig(type);
    if (block) {
      const newBlock = { ...block, order: blocks.length };
      onBlocksChange([...blocks, newBlock]);
      setSelectedBlockIndex(blocks.length);
    }
  };

  const getSelectedNestedBlock = (): Block | null => {
    if (!selectedNestedBlock) return null;
    const parentBlock = blocks[selectedNestedBlock.parentIndex];
    if (!parentBlock) return null;

    // If parent is a row, get the column first, then the blocks
    if (selectedNestedBlock.parentType === 'row') {
      const columnIndex = (selectedNestedBlock as any).columnIndex;
      const columns = (parentBlock as any).columns ?? [];
      const column = columns[columnIndex];
      if (!column) return null;
      return (column.blocks ?? [])[selectedNestedBlock.nestedIndex] ?? null;
    }

    // For column or card, blocks are directly on the parent
    const blocksList = (parentBlock as any).blocks ?? [];
    return blocksList[selectedNestedBlock.nestedIndex] ?? null;
  };

  const selectedBlock = selectedBlockIndex !== null && blocks[selectedBlockIndex] ? blocks[selectedBlockIndex] : null;

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
                        isSelected={selectedBlockIndex === i}
                        isExpanded={expandedBlockIndex === i}
                        onSelect={() => {
                          setSelectedBlockIndex(i);
                          setSelectedNestedBlock(null);
                          // Auto-expand container blocks
                          if (['row', 'column', 'card'].includes(block.type)) {
                            setExpandedBlockIndex(expandedBlockIndex === i ? null : i);
                          }
                        }}
                      />

                      {/* Inline nested editor for expanded container blocks */}
                      {expandedBlockIndex === i && ['row', 'column', 'card'].includes(block.type) && (
                        <div className="ml-4 mt-2 mb-3 border-2 border-primary bg-surface-container">
                          {block.type === 'row' && (
                            <div className="p-3">
                              <ColumnsEditor
                                columns={(block as any).columns ?? []}
                                onChange={cols => {
                                  updateBlock(i, { ...block, columns: cols });
                                }}
                                onSelectNestedBlock={(blockId, colIndex) => {
                                  const col = (block as any).columns?.[colIndex];
                                  if (col) {
                                    const nestedIndex = col.blocks?.findIndex((b: Block) => b.id === blockId) ?? -1;
                                    // Store: parentIndex=row, columnIndex=colIndex, nestedIndex=nested block index
                                    setSelectedNestedBlock({ blockId, parentIndex: i, parentType: 'row', nestedIndex, columnIndex: colIndex } as any);
                                  }
                                }}
                              />
                            </div>
                          )}
                          {(block.type === 'column' || block.type === 'card') && (
                            <div className="p-3">
                              <NestedBlocksEditor
                                blocks={(block as any).blocks ?? []}
                                onChange={nestedBlocks => {
                                  updateBlock(i, { ...block, blocks: nestedBlocks });
                                }}
                                label={block.type === 'column' ? 'Column Content' : 'Card Content'}
                                onSelectBlock={(nestedBlock, nestedIndex) => {
                                  setSelectedNestedBlock({ blockId: nestedBlock.id, parentIndex: i, parentType: block.type as 'column' | 'card', nestedIndex });
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
          {/* Block settings section */}
          {selectedNestedBlock ? (
            // Nested block selected - show its settings in main sidebar
            (() => {
              const nestedBlock = getSelectedNestedBlock();
              if (!nestedBlock) return null;
              const parentBlock = blocks[selectedNestedBlock.parentIndex];

              // Get the parent blocks list (works for row->column->blocks, column->blocks, card->blocks)
              let parentBlocksList: Block[] = [];
              if (selectedNestedBlock.parentType === 'row') {
                const columnIndex = (selectedNestedBlock as any).columnIndex;
                const columns = (parentBlock as any).columns ?? [];
                const column = columns[columnIndex];
                parentBlocksList = column?.blocks ?? [];
              } else {
                parentBlocksList = (parentBlock as any).blocks ?? [];
              }

              return (
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <Heading level={4}>Nested Block Settings</Heading>
                      <Text variant="code" color="secondary" className="mt-1">
                        {blockRegistry.get(nestedBlock.type)?.label ?? nestedBlock.type}
                      </Text>
                      <Text variant="caption" color="secondary" className="mt-1">
                        in {selectedNestedBlock.parentType}{selectedNestedBlock.parentType === 'row' && (` (col ${(selectedNestedBlock as any).columnIndex + 1})`)}
                      </Text>
                    </div>
                    <Button
                      onClick={() => {
                        const updated = parentBlocksList.filter((_: Block, idx: number) => idx !== selectedNestedBlock.nestedIndex);
                        if (selectedNestedBlock.parentType === 'row') {
                          const columnIndex = (selectedNestedBlock as any).columnIndex;
                          const columns = (parentBlock as any).columns ?? [];
                          const updatedColumns = columns.map((col: ColumnBlock, idx: number) =>
                            idx === columnIndex ? { ...col, blocks: updated } : col
                          );
                          updateBlock(selectedNestedBlock.parentIndex, { ...(parentBlock as any), columns: updatedColumns });
                        } else {
                          updateBlock(selectedNestedBlock.parentIndex, { ...(parentBlock as any), blocks: updated });
                        }
                        setSelectedNestedBlock(null);
                      }}
                      variant="destructive"
                      size="xs"
                      title="Delete block"
                    >
                      Delete
                    </Button>
                  </div>
                  <BlockConfigForm
                    block={nestedBlock}
                    onChange={b => {
                      const updated = parentBlocksList.map((blk: Block, idx: number) => idx === selectedNestedBlock.nestedIndex ? b : blk);
                      if (selectedNestedBlock.parentType === 'row') {
                        const columnIndex = (selectedNestedBlock as any).columnIndex;
                        const columns = (parentBlock as any).columns ?? [];
                        const updatedColumns = columns.map((col: ColumnBlock, idx: number) =>
                          idx === columnIndex ? { ...col, blocks: updated } : col
                        );
                        updateBlock(selectedNestedBlock.parentIndex, { ...(parentBlock as any), columns: updatedColumns });
                      } else {
                        updateBlock(selectedNestedBlock.parentIndex, { ...(parentBlock as any), blocks: updated });
                      }
                    }}
                    schemaSlug={schemaSlug}
                  />
                </div>
              );
            })()
          ) : selectedBlock && !['row', 'column', 'card'].includes(selectedBlock.type) ? (
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <Heading level={4}>Block Settings</Heading>
                  <Text variant="code" color="secondary" className="mt-1">
                    {blockRegistry.get(selectedBlock.type)?.label ?? selectedBlock.type}
                  </Text>
                </div>
                <Button
                  onClick={() => removeBlock(selectedBlockIndex ?? -1)}
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
                onChange={b => updateBlock(selectedBlockIndex ?? -1, b)}
                schemaSlug={schemaSlug}
              />
            </div>
          ) : selectedBlock && ['row', 'column', 'card'].includes(selectedBlock.type) ? (
            <div className="flex-1 flex items-center justify-center text-center p-4">
              <div>
                <Text variant="body-sm" className="font-bold uppercase mb-2">Container Block</Text>
                <Text variant="caption" color="secondary">Edit content in the expanded area above</Text>
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => removeBlock(selectedBlockIndex ?? -1)}
                    variant="destructive"
                    size="xs"
                    icon={<MdDelete size={14} />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
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
}: {
  block: Block;
  index: number;
  isSelected: boolean;
  isExpanded?: boolean;
  onSelect: () => void;
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
        className="flex items-center gap-2 px-3 py-2"
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
        <div className="flex-1 min-w-0">
          <Text variant="code" color="secondary" as="span" className="block uppercase tracking-wider font-bold">{typeLabel}</Text>
          {block && (block as any).config?.label && (
            <Text variant="body-sm" as="span" className="block truncate">{(block as any).config.label}</Text>
          )}
        </div>
        {isContainer && (
          <span className="text-on-surface-variant shrink-0 flex items-center">
            {isExpanded ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
          </span>
        )}
      </div>
    </div>
  );
}
