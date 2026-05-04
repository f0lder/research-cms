'use client';
import { FieldDefinition } from '@research-cms/shared-types';
import { Button, Text, Heading } from '@/components/ui';
import { SchemaFieldItem } from './SchemaFieldItem';

interface SchemaFieldsListProps {
  fields: FieldDefinition[];
  disabled: boolean;
  onAddField: () => void;
  onEditField: (index: number) => void;
  onDeleteField: (index: number) => void;
}

export function SchemaFieldsList({
  fields,
  disabled,
  onAddField,
  onEditField,
  onDeleteField,
}: SchemaFieldsListProps) {
  const systemFields = fields.filter(f => f.system);
  const customFields = fields.filter(f => !f.system);

  return (
    <div>
      <Heading level={3} className="mb-3">
        Fields
      </Heading>

      {/* System Fields Section */}
      {systemFields.length > 0 && (
        <div className="mb-6 border-2 border-on-surface-variant bg-surface-container-low p-4 rounded">
          <h4 className="text-xs font-bold uppercase text-on-surface-variant mb-3">System Fields (Read-Only)</h4>
          <div className="space-y-2">
            {systemFields.map(field => (
              <div key={field.name} className="text-sm bg-surface p-2 border-l-4 border-on-surface-variant">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-on-surface">{field.label}</strong>
                    <span className="text-xs text-on-surface-variant ml-2 font-mono">{field.name}</span>
                  </div>
                  <span className="text-xs font-mono text-on-surface-variant">{field.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Fields Section */}
      {customFields.length > 0 && (
        <div className="mb-4 border-2 border-on-surface rounded overflow-hidden">
          <div className="bg-surface-container-high border-b-2 border-on-surface px-4 py-2">
            <h4 className="text-xs font-bold uppercase text-on-surface">Custom Fields</h4>
          </div>
          <div className="divide-y-2 divide-on-surface">
            {customFields.map((field, index) => {
              const originalIndex = fields.indexOf(field);
              return (
                <SchemaFieldItem
                  key={field.name}
                  field={field}
                  disabled={disabled}
                  onEdit={() => onEditField(originalIndex)}
                  onDelete={() => onDeleteField(originalIndex)}
                />
              );
            })}
          </div>
        </div>
      )}

      {customFields.length === 0 && (
        <Text
          variant="body-sm"
          color="secondary"
          className="mb-3 p-3 border-2 border-on-surface-variant bg-surface-container-low rounded"
        >
          No custom fields defined. Click &quot;Add Field&quot; to start.
        </Text>
      )}

      <Button type="button" onClick={onAddField} disabled={disabled} variant="primary" size="sm" className="mt-2">
        + Add Field
      </Button>
    </div>
  );
}
