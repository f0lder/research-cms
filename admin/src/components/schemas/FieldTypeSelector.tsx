'use client';
import { FieldType } from '@research-cms/shared-types';
import { Card, Grid, TypeIcon } from '@/components/ui';

interface FieldTypeSelectorProps {
  onSelect: (type: FieldType) => void;
}

const FIELD_TYPES: Record<FieldType, { label: string; description: string }> = {
  text: { label: 'Text', description: 'Short text input' },
  textarea: { label: 'Textarea', description: 'Long text input' },
  richtext: { label: 'Rich Text', description: 'Formatted text' },
  number: { label: 'Number', description: 'Numeric value' },
  boolean: { label: 'Boolean', description: 'True/False toggle' },
  date: { label: 'Date', description: 'Date picker' },
  datetime: { label: 'Date & Time', description: 'Date and time' },
  select: { label: 'Select', description: 'Dropdown menu' },
  reference: { label: 'Reference', description: 'Link to document' },
  email: { label: 'Email', description: 'Email address' },
  url: { label: 'URL', description: 'Web link' },
  tags: { label: 'Tags', description: 'Multiple tags' },
  media: { label: 'Media', description: 'Image or file' },
  references: { label: 'References', description: 'Multiple links' },
  blocks: { label: 'Blocks', description: 'Complex content' },
};

export function FieldTypeSelector({ onSelect }: FieldTypeSelectorProps) {
  return (
    <Grid columns={2} gap="sm">
      {Object.entries(FIELD_TYPES).map(([type, { label, description }]) => (
        <Card
          key={type}
          interactive
          variant="outlined"
          onClick={() => onSelect(type as FieldType)}
          className="cursor-pointer"
        >
          <div className="flex items-start gap-3 text-left">
            <div className="mt-0.5 text-on-surface">
              <TypeIcon type={type as FieldType} className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm uppercase text-on-surface">{label}</div>
              <div className="text-xs text-on-surface-variant mt-1">{description}</div>
              <div className="text-xs text-on-surface-variant font-mono mt-2">{type}</div>
            </div>
          </div>
        </Card>
      ))}
    </Grid>
  );
}
