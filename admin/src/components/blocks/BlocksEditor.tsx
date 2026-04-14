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
  const isContainerBlock = selectedBlock && ['row', 'column', 'card'].includes(selectedBlock.type);

  return (
    <div className="page flex flex-col h-screen overflow-hidden">
      {/* Header */}
      {onHeaderContent && (
        <div className="flex-shrink-0 mb-6">
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
                        <div className="ml-4 mt-2 mb-3 rounded border-2 border-blue-300 bg-blue-50">
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
              <div className="p-6 border border-dashed border-zinc-300 bg-zinc-50 rounded text-center text-zinc-400 font-mono text-xs max-w-xs">
                <p className="mb-2">No blocks yet</p>
                <p className="text-[11px]">Click the button below to add a block</p>
              </div>
            </div>
          )}

          {/* Add Block button - main area */}
          <div className="flex-shrink-0 mt-4 mb-4">
            <button
              onClick={() => setShowAddBlockPanel(!showAddBlockPanel)}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-mono rounded transition-colors"
            >
              + Add Block
            </button>
            {showAddBlockPanel && (
              <div className="mt-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
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
            <div className="flex-shrink-0 mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs font-mono">
              {infoNote}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-80 flex-shrink-0 border-l border-zinc-200 bg-zinc-50 flex flex-col overflow-hidden">
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
                      <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                        Nested Block Settings
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">
                        {blockRegistry.get(nestedBlock.type)?.label ?? nestedBlock.type}
                      </p>
                      <p className="text-[9px] text-zinc-400 mt-1">
                        in {selectedNestedBlock.parentType}{selectedNestedBlock.parentType === 'row' && (` (col ${(selectedNestedBlock as any).columnIndex + 1})`)}
                      </p>
                    </div>
                    <button
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
                      className="text-xs text-red-400 hover:text-red-600 font-mono px-2 py-1 hover:bg-red-50 rounded"
                      title="Delete block"
                    >
                      Delete
                    </button>
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
                  <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                    Block Settings
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">
                    {blockRegistry.get(selectedBlock.type)?.label ?? selectedBlock.type}
                  </p>
                </div>
                <button
                  onClick={() => removeBlock(selectedBlockIndex ?? -1)}
                  className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                  title="Delete block"
                >
                  <MdDelete size={14} />
                  Delete
                </button>
              </div>
              <BlockConfigForm
                block={selectedBlock}
                onChange={b => updateBlock(selectedBlockIndex ?? -1, b)}
                schemaSlug={schemaSlug}
              />
            </div>
          ) : selectedBlock && ['row', 'column', 'card'].includes(selectedBlock.type) ? (
            <div className="flex-1 flex items-center justify-center text-center p-4">
              <div className="text-zinc-400 font-mono text-xs">
                <p className="mb-2">Container Block</p>
                <p className="text-[10px]">Edit content in the expanded area above</p>
                <button
                  onClick={() => removeBlock(selectedBlockIndex ?? -1)}
                  className="mt-4 inline-flex items-center gap-2 px-2 py-1 text-xs text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                >
                  <MdDelete size={14} />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-4">
              <div className="text-zinc-400 font-mono text-xs">
                <p className="mb-1">No block selected</p>
                <p className="text-[10px]">Click a block to edit its settings</p>
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
  index,
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
      className={`border cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-zinc-200 bg-white hover:border-zinc-300'
      } rounded mb-3 ${isExpanded ? 'ring-2 ring-blue-300' : ''}`}
    >
      <div
        onClick={onSelect}
        className="flex items-center gap-2 px-3 py-2"
      >
        <button
          {...attributes}
          {...listeners}
          className="text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing leading-none select-none flex-shrink-0 flex items-center"
          aria-label="Drag to reorder"
          onClick={e => e.stopPropagation()}
        >
          <MdDragIndicator size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{typeLabel}</p>
          {block && (block as any).config?.label && (
            <p className="text-xs text-zinc-600 truncate">{(block as any).config.label}</p>
          )}
        </div>
        {isContainer && (
          <span className="text-zinc-400 flex-shrink-0 flex items-center">
            {isExpanded ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
          </span>
        )}
      </div>
    </div>
  );
}
