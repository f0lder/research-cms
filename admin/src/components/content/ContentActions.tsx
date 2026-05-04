'use client';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { Button } from '@/components/ui';

interface ContentActionsProps {
  schema: ContentTypeDefinition;
  saving: boolean;
  error: string | null;
  onSaveDraft: () => Promise<void>;
  onPublish: () => Promise<void>;
  onCancel: () => void;
}

export function ContentActions({
  schema,
  saving,
  error,
  onSaveDraft,
  onPublish,
  onCancel,
}: ContentActionsProps) {
  return (
    <>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="flex gap-3 pt-4 border-t border-zinc-100">
        {schema.features?.drafts !== false && (
          <Button
            type="button"
            onClick={onSaveDraft}
            disabled={saving}
            className="btn-secondary"
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </Button>
        )}
        <Button type="button" onClick={onPublish} disabled={saving} className="btn-primary">
          {saving ? 'Publishing…' : 'Publish'}
        </Button>
        <Button type="button" onClick={onCancel} disabled={saving} className="btn-ghost">
          Cancel
        </Button>
      </div>
    </>
  );
}
