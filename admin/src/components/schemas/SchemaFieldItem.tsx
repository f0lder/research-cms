'use client';
import { FieldDefinition } from '@research-cms/shared-types';
import { TypeIcon, Button, Text, Badge } from '@/components/ui';

interface SchemaFieldItemProps {
  field: FieldDefinition;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function SchemaFieldItem({ field, disabled, onEdit, onDelete }: SchemaFieldItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 hover:bg-surface-container-low transition-colors border-b-2 border-on-surface last:border-b-0">
      <div className="flex-1 min-w-0">
        <Text variant="body-sm" className="font-semibold">{field.label}</Text>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Text variant="code" color="secondary">{field.name}</Text>
          <Text variant="caption" color="secondary">•</Text>
          <div className="flex items-center gap-1 text-primary">
            <TypeIcon type={field.type} className="w-3.5 h-3.5" />
            <Text variant="code" className="text-primary">{field.type}</Text>
          </div>
          {field.required && (
            <>
              <Text variant="caption" color="secondary">•</Text>
              <Text variant="code" color="error">
                Required
              </Text>
            </>
          )}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          variant="primary"
          size="sm"
          title="Edit field"
        >
          Edit
        </Button>
        <Button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          variant="destructive"
          size="sm"
          title="Delete field"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
