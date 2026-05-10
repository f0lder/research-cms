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
import { Button } from '@/components/ui/Button';
import { SettingRow } from '@/components/settings/SettingRow';
import { useToast } from '@/contexts/ToastContext';

export default function GlobalSettingsPage() {
  const [items, setItems] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const { showToast } = useToast();

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

        <section>
          <h2 className="text-sm font-semibold text-zinc-900 mb-2">Toast testing</h2>
          <div className="panel flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => showToast('This is a success toast', 'success')}
            >
              Success
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => showToast('This is an error toast', 'error')}
            >
              Error
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => showToast('This is an info toast', 'info')}
            >
              Info
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => showToast('This is a warning toast', 'warning')}
            >
              Warning
            </Button>
          </div>
        </section>
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
