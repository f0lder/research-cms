import { useRef, useEffect } from 'react';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { Toggle } from '../ui';

interface ColumnPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibleCols: string[];
  onToggleCol: (key: string) => void;
  schema: ContentTypeDefinition;
}

export function ColumnPicker({ open, onOpenChange, visibleCols, onToggleCol, schema }: ColumnPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const showStatus = visibleCols.includes('status');
  const showDate = visibleCols.includes('date');

  // Close picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onOpenChange]);

  return (
    <div className="relative ml-auto" ref={pickerRef}>
      <button
        onClick={() => onOpenChange(!open)}
        className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
      >
        Columns
        <span className="text-zinc-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-zinc-200 shadow-sm z-10 py-2">
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 px-3 pb-2 border-b border-zinc-100 mb-1">
            Visible columns
          </p>
          {schema.fields.map(field => (
            <div
              key={field.name}
              className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-zinc-50 text-sm text-zinc-700"
            >
              <Toggle
                checked={visibleCols.includes(field.name)}
                onChange={() => onToggleCol(field.name)}
              />
              {field.label}
              <span className="ml-auto text-[10px] text-zinc-300 font-mono">{field.type}</span>
            </div>
          ))}
          <div className="border-t border-zinc-100 mt-1 pt-1">
            <div className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-zinc-50 text-sm text-zinc-700">
              <Toggle
                checked={showStatus}
                onChange={() => onToggleCol('status')}
              />
              Status
              <span className="ml-auto text-[10px] text-zinc-300 font-mono">system</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-zinc-50 text-sm text-zinc-700">
              <Toggle
                checked={showDate}
                onChange={() => onToggleCol('date')}
              />
              Date
              <span className="ml-auto text-[10px] text-zinc-300 font-mono">system</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
