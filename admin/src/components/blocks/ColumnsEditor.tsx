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
  onSelectNestedBlock?: (blockId: string) => void;
}) {
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
  };

  const updateColumn = (index: number, updated: ColumnBlock) => {
    onChange(columns.map((c, i) => i === index ? updated : c));
  };

  const removeColumn = (index: number) => {
    onChange(columns.filter((_, i) => i !== index));
  };

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
        <div className="flex flex-col md:flex-row gap-3">
          {columns.map((col, i) => (
            <div key={col.id || i} className="flex-1 flex flex-col border-2 border-primary bg-surface-container overflow-hidden min-w-0">
              <div className="flex items-center justify-between p-2 border-b-2 border-primary bg-surface shrink-0">
                <Text variant="body-sm" className="font-bold uppercase truncate pr-2">
                  Col {i + 1}
                </Text>
                <Button
                  onClick={() => removeColumn(i)}
                  variant="destructive"
                  size="xs"
                  icon={<MdDelete size={14} />}
                  title="Delete column"
                  className="shrink-0"
                >
                  <span className="hidden xl:inline">Delete</span>
                </Button>
              </div>
              <div className="p-2 flex-1 overflow-y-auto">
                <NestedBlocksEditor
                  blocks={col.blocks ?? []}
                  onChange={blocks =>
                    updateColumn(i, {
                      ...col,
                      blocks,
                    })
                  }
                  label=""
                  onSelectBlock={(block) =>
                    onSelectNestedBlock?.(block.id)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
