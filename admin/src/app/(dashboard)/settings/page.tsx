'use client';
import { useState, useEffect, useCallback } from 'react';
import { SettingDefinition } from '@research-cms/shared-types';
import {
  getSettings,
  updateSetting,
  clearSetting,
  SettingItem,
} from '@/app/actions';
import { ListSkeleton } from '@/components/skeletons';

export default function GlobalSettingsPage() {
  const [items, setItems] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await getSettings({ scope: 'global' });
    if (err) setError(err);
    if (data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (def: SettingDefinition, value: unknown) => {
    setSavingKey(def.key);
    const { error: err } = await updateSetting({ scope: 'global' }, def.key, value);
    if (err) alert(err);
    else setItems(prev => prev.map(it =>
      it.definition.key === def.key ? { ...it, value } : it,
    ));
    setSavingKey(null);
  };

  const handleReset = async (def: SettingDefinition) => {
    setSavingKey(def.key);
    const { error: err } = await clearSetting({ scope: 'global' }, def.key);
    if (err) alert(err);
    else setItems(prev => prev.map(it =>
      it.definition.key === def.key ? { ...it, value: def.defaultValue } : it,
    ));
    setSavingKey(null);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="mb-8 space-y-2 w-1/2">
          <div className="h-8 bg-zinc-200 rounded animate-pulse" />
          <div className="h-4 bg-zinc-100 rounded animate-pulse" />
        </div>
        <ListSkeleton items={4} />
      </div>
    );
  }

  const grouped = groupByCategory(items);

  return (
    <div className="page">
      <div className="mb-8">
        <h1 className="page-heading">Settings</h1>
        <p className="page-sub">Global system settings</p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {items.length === 0 && (
        <div className="panel text-sm text-zinc-500">
          No global settings registered.
        </div>
      )}

      <div className="flex flex-col gap-6">
        {Object.entries(grouped).map(([category, group]) => (
          <section key={category}>
            <h2 className="text-sm font-semibold text-zinc-900 mb-2">{category}</h2>
            <div className="flex flex-col gap-2">
              {group.map(item => (
                <SettingRow
                  key={item.definition.key}
                  item={item}
                  saving={savingKey === item.definition.key}
                  onSave={value => handleSave(item.definition, value)}
                  onReset={() => handleReset(item.definition)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function groupByCategory(items: SettingItem[]): Record<string, SettingItem[]> {
  const out: Record<string, SettingItem[]> = {};
  for (const item of items) {
    const cat = item.definition.category;
    (out[cat] ??= []).push(item);
  }
  return out;
}

interface SettingRowProps {
  item: SettingItem;
  saving: boolean;
  onSave: (value: unknown) => void;
  onReset: () => void;
}

function SettingRow({ item, saving, onSave, onReset }: SettingRowProps) {
  const { definition, value } = item;
  const [draft, setDraft] = useState<unknown>(value);

  useEffect(() => { setDraft(value); }, [value]);

  const dirty = draft !== value;

  return (
    <div className="panel">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{definition.label}</p>
          {definition.description && (
            <p className="text-xs text-zinc-500 mt-0.5">{definition.description}</p>
          )}
          <p className="text-xs text-zinc-300 mt-0.5">{definition.key}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-xs text-zinc-500 hover:text-zinc-900"
            onClick={onReset}
            disabled={saving}
          >
            Reset
          </button>
          <button
            className="btn-primary text-xs"
            onClick={() => onSave(draft)}
            disabled={!dirty || saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <SettingField definition={definition} value={draft} onChange={setDraft} />
    </div>
  );
}

interface SettingFieldProps {
  definition: SettingDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

function SettingField({ definition, value, onChange }: SettingFieldProps) {
  switch (definition.type) {
    case 'text':
      return (
        <input
          type="text"
          className="field-input"
          value={(value as string | undefined) ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      );
    case 'textarea':
      return (
        <textarea
          className="field-input"
          rows={3}
          value={(value as string | undefined) ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          className="field-input"
          value={(value as number | undefined) ?? ''}
          onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      );
    case 'boolean':
      return (
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={e => onChange(e.target.checked)}
          />
          <span>Enabled</span>
        </label>
      );
    case 'color':
      return (
        <input
          type="color"
          className="h-9 w-20 rounded border border-zinc-200"
          value={(value as string | undefined) ?? '#000000'}
          onChange={e => onChange(e.target.value)}
        />
      );
    case 'select':
      return (
        <select
          className="field-input"
          value={(value as string | undefined) ?? ''}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">— Select —</option>
          {(definition.options ?? []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case 'media':
      return (
        <input
          type="text"
          className="field-input"
          placeholder="Media entry id"
          value={(value as string | undefined) ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      );
  }
}
