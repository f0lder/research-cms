'use client';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { TextField, Heading, Toggle } from '@/components/ui';

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
          <div className="flex items-start gap-2">
            <Toggle
              checked={features?.drafts ?? true}
              onChange={checked =>
                onFeaturesChange({
                  ...features,
                  drafts: checked,
                })
              }
              disabled={disabled}
            />
            <div>
              <span className="font-bold uppercase text-on-surface block">Enable Drafts</span>
              <span className="text-xs text-on-surface-variant">Allow unpublished drafts</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Toggle
              checked={features?.revisions ?? false}
              onChange={checked =>
                onFeaturesChange({
                  ...features,
                  revisions: checked,
                })
              }
              disabled={disabled}
            />
            <div>
              <span className="font-bold uppercase text-on-surface block">Enable Revisions</span>
              <span className="text-xs text-on-surface-variant">Track version history</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Toggle
              checked={features?.search ?? true}
              onChange={checked =>
                onFeaturesChange({
                  ...features,
                  search: checked,
                })
              }
              disabled={disabled}
            />
            <div>
              <span className="font-bold uppercase text-on-surface block">Enable Search</span>
              <span className="text-xs text-on-surface-variant">Index entries in search</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Toggle
              checked={features?.seo ?? false}
              onChange={checked =>
                onFeaturesChange({
                  ...features,
                  seo: checked,
                })
              }
              disabled={disabled}
            />
            <div>
              <span className="font-bold uppercase text-on-surface block">Enable SEO Fields</span>
              <span className="text-xs text-on-surface-variant">Add meta title, description</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
