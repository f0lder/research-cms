'use client';
import { FieldDefinition } from '@research-cms/shared-types';

interface SchemaFieldItemProps {
  field: FieldDefinition;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function SchemaFieldItem({ field, disabled, onEdit, onDelete }: SchemaFieldItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 hover:bg-surface-container-low transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-on-surface">{field.label}</div>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1 flex-wrap">
          <span className="font-mono">{field.name}</span>
          <span>•</span>
          <span className="font-mono text-primary">{field.type}</span>
          {field.required && (
            <>
              <span>•</span>
              <span className="font-bold text-error">required</span>
            </>
          )}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="px-3 py-1.5 bg-primary text-surface text-xs font-bold uppercase hover:opacity-80 disabled:opacity-50"
          title="Edit field"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="px-3 py-1.5 bg-error text-surface text-xs font-bold uppercase hover:opacity-80 disabled:opacity-50"
          title="Delete field"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
