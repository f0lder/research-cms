'use client';
import { FieldType } from '@research-cms/shared-types';

interface FieldTypeSelectorProps {
  onSelect: (type: FieldType) => void;
}

const FIELD_TYPES: Record<FieldType, string> = {
  text: 'Text',
  textarea: 'Textarea',
  richtext: 'Rich Text',
  number: 'Number',
  boolean: 'Boolean',
  date: 'Date',
  datetime: 'Date & Time',
  select: 'Select',
  reference: 'Reference',
  email: 'Email',
  url: 'URL',
  tags: 'Tags',
  media: 'Media',
  references: 'References',
  blocks: 'Blocks',
};

export function FieldTypeSelector({ onSelect }: FieldTypeSelectorProps) {
  return (
    <div className="space-y-4">
		  {Object.entries(FIELD_TYPES).map(([type, label]) => (
        <div key={type}>
          <h3 className="text-xs font-bold uppercase text-on-surface-variant mb-2">{label}</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
                key={type}
                onClick={() => onSelect(type)}
                className="border-2 border-on-surface p-3 text-left hover:bg-primary hover:text-surface hover:border-primary transition-colors"
              >
                <div className="font-semibold text-sm">{FIELD_TYPES[type]}</div>
                <div className="text-xs text-on-surface-variant">{type}</div>
              </button>
		  </div>
          </div>
      ))}
    </div>
  );
}
