'use client';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MdDelete } from 'react-icons/md';
import { ColumnBlock } from '@research-cms/shared-types';
import { NestedBlocksEditor } from './NestedBlocksEditor';
import { Button, Text } from '@/components/ui';

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
        <Button
          onClick={addColumn}
          variant="secondary"
          size="xs"
          className="self-start"
        >
          + Add Column
        </Button>
      )}

      {/* Add column button for empty state */}
      {columns.length === 0 ? (
        <div className="text-center p-6">
          <Text variant="body-sm" color="secondary" className="mb-3">No columns yet</Text>
          <div className="flex justify-center">
            <Button onClick={addColumn} variant="primary" size="sm">
              + Add Column
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Visual columns grid */}
          <div className="flex gap-2 border-2 border-on-surface p-3 bg-surface-container min-h-32">
            {columns.map((col, i) => (
              <div
                key={i}
                onClick={() => setSelectedColumnIndex(i)}
                className={`flex-1 border-2 cursor-pointer transition-all min-h-32 p-2 flex flex-col items-center justify-center ${selectedColumnIndex === i
                  ? 'border-primary bg-surface shadow-hard'
                  : 'border-on-surface bg-surface hover:bg-surface-container'
                  }`}
              >
                <Text variant="code" color="secondary" className="font-bold uppercase mb-1">Column {i + 1}</Text>
                <Text variant="caption" color="secondary">
                  ({col.blocks?.length ?? 0} block{(col.blocks?.length ?? 0) !== 1 ? 's' : ''})
                </Text>
              </div>
            ))}
          </div>

          {/* Selected column editor */}
          {selectedColumn && selectedColumnIndex !== null && (
            <div className="border-2 border-primary p-3 bg-surface-container">
              <div className="flex items-center justify-between mb-3">
                <Text variant="body-sm" className="font-bold uppercase">
                  Column {selectedColumnIndex + 1} Content
                </Text>
                <Button
                  onClick={() => removeColumn(selectedColumnIndex)}
                  variant="destructive"
                  size="xs"
                  icon={<MdDelete size={14} />}
                  title="Delete column"
                >
                  Delete
                </Button>
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
                onSelectBlock={(block) =>
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
