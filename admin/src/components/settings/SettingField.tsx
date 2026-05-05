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
}

/**
 * Renders a single setting input based on its registered type.
 * Special-cases `client.homePage` with a page picker.
 */
export function SettingField({
  definition,
  value,
  onChange,
  saving = false,
  pages = [],
}: SettingFieldProps) {
  // Page picker — special case for the home page setting
  if (definition.key === 'client.homePage') {
    const opts = pages.map(p => ({
      value: p._id ?? '',
      label: (p.data?.title as string) ?? p._id ?? '',
    }));
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
          isDisabled={saving || opts.length === 0}
          placeholder={opts.length === 0 ? 'No pages available' : 'No home page set'}
          classNamePrefix="rs"
          styles={{
            control: base => ({ ...base, minHeight: 40, fontSize: 13, fontFamily: 'Inter', fontWeight: 600, borderColor: '#000000', borderWidth: 2, borderRadius: 0, boxShadow: 'none', '&:hover': { borderColor: '#000000' } }),
            menu: base => ({ ...base, fontSize: 13, fontFamily: 'Inter', fontWeight: 600, borderRadius: 0, zIndex: 30, border: '2px solid #000', boxShadow: '4px 4px 0 #000' }),
            option: (base, s) => ({ ...base, backgroundColor: s.isFocused ? '#F5F5F5' : '#FFFFFF', color: '#000000' }),
            placeholder: base => ({ ...base, color: '#5a4136' }),
          }}
        />
      </div>
    );
  }

  switch (definition.type) {
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
      return (
        <input
          type="text"
          className="field-input"
          placeholder="Media entry id"
          value={(value as string | undefined) ?? ''}
          onChange={e => onChange(e.target.value)}
          disabled={saving}
        />
      );

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
