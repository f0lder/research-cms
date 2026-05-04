'use client';
import { Button } from '@/components/ui';

interface SchemaSaveActionsProps {
  mode: 'create' | 'edit';
  isSubmitting: boolean;
  onCancel: () => void;
}

export function SchemaSaveActions({ mode, isSubmitting, onCancel }: SchemaSaveActionsProps) {
  return (
    <div className="flex gap-3 pt-4 border-t-2 border-on-surface">
      <Button
        type="submit"
        disabled={isSubmitting}
        variant="primary"
        size="lg"
        className="flex-1"
      >
        {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Schema' : 'Update Schema'}
      </Button>
      <Button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        variant="secondary"
        size="lg"
      >
        Cancel
      </Button>
    </div>
  );
}
