'use client';
import { useEffect, useState } from 'react';
import { SettingDefinition } from '@research-cms/shared-types';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { SettingField } from './SettingField';

type SettingItem = { definition: SettingDefinition; value: unknown };

interface SettingRowProps {
  item: SettingItem;
  saving: boolean;
  onSave: (value: unknown) => void;
  onReset: () => void;
}

export function SettingRow({ item, saving, onSave, onReset }: SettingRowProps) {
  const { definition, value } = item;
  const [draft, setDraft] = useState<unknown>(value);

  useEffect(() => { setDraft(value); }, [value]);

  const dirty = draft !== value;

  return (
    <div className="panel">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <Text variant='body-lg'>{definition.label}</Text>
          {definition.description && (
            <Text variant='body-sm'>
              {definition.description}
            </Text>
          )}
          <Text variant='code'>
            {definition.key}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-zinc-500 hover:text-zinc-900"
            onClick={onReset}
            disabled={saving}
          >
            Reset
          </Button>
          <Button
            variant='primary'
            size="sm"
            onClick={() => onSave(draft)}
            disabled={!dirty || saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
      <SettingField definition={definition} value={draft} onChange={setDraft} />
    </div>
  );
}
