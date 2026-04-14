'use client';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MdDelete } from 'react-icons/md';
import { ColumnBlock } from '@research-cms/shared-types';
import { NestedBlocksEditor } from './NestedBlocksEditor';

/**
 * Visual columns editor for Row blocks.
 * Shows columns as horizontal containers you can click into and edit.
 */
export function ColumnsEditor({
  columns,
  onChange,
  onSelectNestedBlock,
}: {
  columns: ColumnBlock[];
  onChange: (columns: ColumnBlock[]) => void;
  onSelectNestedBlock?: (blockId: string, columnIndex: number) => void;
}) {
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number | null>(null);

  const addColumn = () => {
    const newColumn: ColumnBlock = {
      type: 'column',
      id: uuidv4(),
      visible: true,
      order: columns.length,
      blocks: [],
      width: 'auto',
    };
    onChange([...columns, newColumn]);
    setSelectedColumnIndex(columns.length);
  };

  const updateColumn = (index: number, updated: ColumnBlock) => {
    onChange(columns.map((c, i) => i === index ? updated : c));
  };

  const removeColumn = (index: number) => {
    onChange(columns.filter((_, i) => i !== index));
    if (selectedColumnIndex === index) {
      setSelectedColumnIndex(null);
    }
  };

  const selectedColumn = selectedColumnIndex !== null ? columns[selectedColumnIndex] : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Add column button - TOP */}
      {columns.length > 0 && (
        <button
          onClick={addColumn}
          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-mono rounded transition-colors border border-blue-200 self-start"
        >
          + Add Column
        </button>
      )}

      {/* Add column button for empty state */}
      {columns.length === 0 ? (
        <div className="text-center p-6">
          <p className="text-xs text-zinc-500 mb-3">No columns yet</p>
          <button
            onClick={addColumn}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-mono rounded transition-colors"
          >
            + Add Column
          </button>
        </div>
      ) : (
        <>
          {/* Visual columns grid */}
          <div className="flex gap-2 border border-zinc-200 rounded-lg p-3 bg-zinc-50 min-h-32">
            {columns.map((col, i) => (
              <div
                key={i}
                onClick={() => setSelectedColumnIndex(i)}
                className={`flex-1 border-2 rounded cursor-pointer transition-all min-h-32 p-2 flex flex-col items-center justify-center ${
                  selectedColumnIndex === i
                    ? 'border-blue-500 bg-blue-100'
                    : 'border-zinc-300 bg-white hover:border-zinc-400'
                }`}
              >
                <p className="text-xs font-mono text-zinc-600 mb-1">Column {i + 1}</p>
                <p className="text-[10px] text-zinc-500">
                  ({col.blocks?.length ?? 0} block{(col.blocks?.length ?? 0) !== 1 ? 's' : ''})
                </p>
              </div>
            ))}
          </div>

          {/* Selected column editor */}
          {selectedColumn && selectedColumnIndex !== null && (
            <div className="border border-blue-300 rounded-lg p-3 bg-blue-50">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-zinc-900">
                  Column {selectedColumnIndex + 1} Content
                </p>
                <button
                  onClick={() => removeColumn(selectedColumnIndex)}
                  className="text-xs text-red-400 hover:text-red-600 inline-flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                  title="Delete column"
                >
                  <MdDelete size={14} />
                  Delete
                </button>
              </div>
              <NestedBlocksEditor
                blocks={selectedColumn.blocks ?? []}
                onChange={blocks =>
                  updateColumn(selectedColumnIndex, {
                    ...selectedColumn,
                    blocks,
                  })
                }
                label={`Column ${selectedColumnIndex + 1}`}
                onSelectBlock={(block, index) =>
                  onSelectNestedBlock?.(block.id, selectedColumnIndex)
                }
              />
            </div>
          )}


        </>
      )}
    </div>
  );
}
