'use client';
import { useState, useEffect, ReactNode } from 'react';
import { SettingDefinition } from '@research-cms/shared-types';
import { ContentEntry } from '@research-cms/shared-types';
import Select from 'react-select';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

type Option = { value: string; label: string };

interface SettingFieldProps {
  definition: SettingDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  saving?: boolean;
  pages?: ContentEntry[];
  clientId?: string;
}

import { PagePickerSelect, Button } from '@/components/ui';
import MediaPickerModal from '@/components/content/MediaPickerModal';
import { getMediaLibrary } from '@/app/actions';
import { MediaEntry } from '@research-cms/shared-types';

export function SettingField({
  definition,
  value,
  onChange,
  saving = false,
  pages = [],
  clientId,
}: SettingFieldProps) {

  switch (definition.type) {
    case 'page':
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <Text variant="caption" color="secondary" as="label" className="uppercase tracking-widest font-bold">
              {definition.label}
            </Text>
            {saving && <Text variant="caption" color="secondary">Saving…</Text>}
          </div>
          {definition.description && (
            <Text variant="caption" color="secondary" className="mb-2">{definition.description}</Text>
          )}
          <PagePickerSelect
            label={null}
            value={value}
            onChange={onChange}
            disabled={saving}
            clientId={clientId}
          />
        </div>
      );

    case 'text':
      return (
        <TextInputSetting
          definition={definition}
          value={value}
          saving={saving}
          onCommit={onChange}
        />
      );

    case 'textarea':
      return (
        <TextAreaSetting
          definition={definition}
          value={value}
          saving={saving}
          onCommit={onChange}
        />
      );

    case 'number':
      return (
        <NumberInputSetting
          definition={definition}
          value={value}
          saving={saving}
          onCommit={onChange}
        />
      );

    case 'boolean':
      return (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={e => onChange(e.target.checked)}
            disabled={saving}
            className="w-4 h-4 accent-primary"
          />
          <div>
            <Text variant="body-sm" className="font-bold uppercase">{definition.label}</Text>
            {definition.description && (
              <Text variant="caption" color="secondary">{definition.description}</Text>
            )}
          </div>
        </label>
      );

    case 'color':
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <Text variant="caption" color="secondary" as="label" className="uppercase tracking-widest font-bold">
              {definition.label}
            </Text>
            {saving && <Text variant="caption" color="secondary">Saving…</Text>}
          </div>
          {definition.description && (
            <Text variant="caption" color="secondary" className="mb-2">{definition.description}</Text>
          )}
          <div className="flex gap-2">
            <input
              type="color"
              className="h-10 w-16 border-2 border-on-surface bg-surface cursor-pointer p-0"
              value={String(value ?? '#000000')}
              onChange={e => onChange(e.target.value)}
              disabled={saving}
            />
            <input
              type="text"
              className="flex-1 border-2 border-on-surface bg-surface px-4 py-2 font-code text-code text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={String(value ?? '')}
              onChange={e => onChange(e.target.value || null)}
              disabled={saving}
              placeholder="#000000"
            />
          </div>
        </div>
      );

    case 'select': {
      const opts = (definition.options ?? []).map(o => ({ value: o, label: o }));
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <Text variant="caption" color="secondary" as="label" className="uppercase tracking-widest font-bold">
              {definition.label}
            </Text>
            {saving && <Text variant="caption" color="secondary">Saving…</Text>}
          </div>
          {definition.description && (
            <Text variant="caption" color="secondary" className="mb-2">{definition.description}</Text>
          )}
          <Select<Option>
            isClearable
            options={opts}
            value={opts.find(o => o.value === value) ?? null}
            onChange={opt => onChange(opt?.value ?? null)}
            isDisabled={saving}
            classNamePrefix="rs"
            styles={{
              control: base => ({ ...base, minHeight: 40, fontSize: 13, borderColor: '#000', borderWidth: 2, borderRadius: 0, boxShadow: 'none', '&:hover': { borderColor: '#000' } }),
              menu: base => ({ ...base, fontSize: 13, borderRadius: 0, zIndex: 30, border: '2px solid #000', boxShadow: '4px 4px 0 #000' }),
              option: (base, s) => ({ ...base, backgroundColor: s.isFocused ? '#F5F5F5' : '#FFFFFF', color: '#000' }),
            }}
          />
        </div>
      );
    }

    case 'media':
      return <MediaSetting definition={definition} value={value as string | undefined} onChange={onChange} saving={saving} />;

    default:
      return (
        <div>
          <Text variant="caption" color="secondary">
            Unsupported setting type: {definition.type}
          </Text>
        </div>
      );
  }
}

function MediaSetting({
  definition, value, onChange, saving,
}: {
  definition: SettingDefinition;
  value: string | undefined;
  onChange: (value: unknown) => void;
  saving: boolean;
}) {
  const [resolved, setResolved] = useState<MediaEntry | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!value) { setResolved(null); return; }
    getMediaLibrary().then(res => {
      const found = res.data?.find(m => m._id === value);
      setResolved(found ?? null);
    });
  }, [value]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Text variant="caption" color="secondary" as="label" className="uppercase tracking-widest font-bold">
          {definition.label}
        </Text>
        {saving && <Text variant="caption" color="secondary">Saving…</Text>}
      </div>
      {definition.description && (
        <Text variant="caption" color="secondary" className="mb-2">{definition.description}</Text>
      )}

      {resolved ? (
        <div className="flex items-center gap-3 border-2 border-on-surface p-2 bg-surface-container-low">
          <img src={resolved.url} alt={resolved.title} className="w-12 h-12 object-cover border border-on-surface" />
          <div className="flex-1 min-w-0">
            <Text variant="body-sm" className="font-bold truncate">{resolved.title}</Text>
            {resolved.fileSize && (
              <Text variant="code" color="secondary">{(resolved.fileSize / 1024).toFixed(1)} KB</Text>
            )}
          </div>
          <Button variant="secondary" size="xs" onClick={() => setPickerOpen(true)} disabled={saving}>Change</Button>
          <Button variant="destructive" size="xs" onClick={() => onChange(null)} disabled={saving}>×</Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)} disabled={saving}>
            Browse Media
          </Button>
          {value && (
            <Text variant="code" color="secondary">ID: {value}</Text>
          )}
        </div>
      )}

      {pickerOpen && (
        <MediaPickerModal
          currentId={value}
          onSelect={entry => { onChange(entry._id); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

/** Text input that only commits on blur (avoids saving on every keystroke). */
function TextInputSetting({
  definition, value, saving, onCommit,
}: {
  definition: SettingDefinition;
  value: unknown;
  saving: boolean;
  onCommit: (value: unknown) => void;
}) {
  const [local, setLocal] = useState(String(value ?? ''));
  useEffect(() => { setLocal(String(value ?? '')); }, [value]);
  return (
    <TextField
      label={definition.label}
      helperText={definition.description}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { if (local !== String(value ?? '')) onCommit(local); }}
      disabled={saving}
    />
  );
}

/** Number input that only commits on blur. */
function NumberInputSetting({
  definition, value, saving, onCommit,
}: {
  definition: SettingDefinition;
  value: unknown;
  saving: boolean;
  onCommit: (value: unknown) => void;
}) {
  const [local, setLocal] = useState(typeof value === 'number' ? String(value) : '');
  useEffect(() => {
    setLocal(typeof value === 'number' ? String(value) : '');
  }, [value]);
  return (
    <TextField
      label={definition.label}
      helperText={definition.description}
      type="number"
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => {
        const n = local === '' ? undefined : Number(local);
        if (n !== value) onCommit(n);
      }}
      disabled={saving}
    />
  );
}

/** Textarea that only commits on blur. */
function TextAreaSetting({
  definition, value, saving, onCommit,
}: {
  definition: SettingDefinition;
  value: unknown;
  saving: boolean;
  onCommit: (value: unknown) => void;
}) {
  const [local, setLocal] = useState(String(value ?? ''));
  useEffect(() => { setLocal(String(value ?? '')); }, [value]);
  return (
    <textarea
      className="field-input"
      placeholder={definition.label}
      title={definition.description}
      rows={3}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { if (local !== String(value ?? '')) onCommit(local); }}
      disabled={saving}
    />
  );
}
