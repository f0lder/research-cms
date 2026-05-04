'use client';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { TextField, Heading } from '@/components/ui';

interface SchemaMetadataProps {
  singularName: string;
  pluralName: string;
  description: string;
  features: ContentTypeDefinition['features'];
  disabled: boolean;
  onSingularNameChange: (value: string) => void;
  onPluralNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onFeaturesChange: (features: ContentTypeDefinition['features']) => void;
}

export function SchemaMetadata({
  singularName,
  pluralName,
  description,
  features,
  disabled,
  onSingularNameChange,
  onPluralNameChange,
  onDescriptionChange,
  onFeaturesChange,
}: SchemaMetadataProps) {
  return (
    <>
      <TextField
        label="Singular Name"
        value={singularName}
        onChange={e => onSingularNameChange(e.target.value)}
        disabled={disabled}
        placeholder="e.g., Product"
        helperText="Used in UI labels (optional)"
      />

      <TextField
        label="Plural Name"
        value={pluralName}
        onChange={e => onPluralNameChange(e.target.value)}
        disabled={disabled}
        placeholder="e.g., Products"
        helperText="Used in UI labels (optional)"
      />

      <TextField
        label="Description"
        value={description}
        onChange={e => onDescriptionChange(e.target.value)}
        disabled={disabled}
        placeholder="Describe what this content type is used for"
        helperText="Optional — helps content editors understand the purpose"
      />

      <div className="border-2 border-on-surface p-4 bg-surface-container-low">
        <Heading level={3} className="mb-4">Features</Heading>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={features?.drafts ?? true}
              onChange={e =>
                onFeaturesChange({
                  ...features,
                  drafts: e.target.checked,
                })
              }
              disabled={disabled}
            />
            <span className="font-bold uppercase text-on-surface">Enable Drafts</span>
            <span className="text-xs text-on-surface-variant">Allow unpublished drafts</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={features?.revisions ?? false}
              onChange={e =>
                onFeaturesChange({
                  ...features,
                  revisions: e.target.checked,
                })
              }
              disabled={disabled}
            />
            <span className="font-bold uppercase text-on-surface">Enable Revisions</span>
            <span className="text-xs text-on-surface-variant">Track version history</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={features?.search ?? true}
              onChange={e =>
                onFeaturesChange({
                  ...features,
                  search: e.target.checked,
                })
              }
              disabled={disabled}
            />
            <span className="font-bold uppercase text-on-surface">Enable Search</span>
            <span className="text-xs text-on-surface-variant">Index entries in search</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={features?.seo ?? false}
              onChange={e =>
                onFeaturesChange({
                  ...features,
                  seo: e.target.checked,
                })
              }
              disabled={disabled}
            />
            <span className="font-bold uppercase text-on-surface">Enable SEO Fields</span>
            <span className="text-xs text-on-surface-variant">Add meta title, description</span>
          </label>
        </div>
      </div>
    </>
  );
}
