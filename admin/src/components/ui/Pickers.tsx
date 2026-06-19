'use client';

import { ReactNode, useState, useEffect } from 'react';
import Select from 'react-select';
import { Text } from './Text';
import { SelectOption, pickerSelectStyles } from './Select';
import { getAllSchemas, getAllEntries } from '@/app/actions';

export type { SelectOption };
export { pickerSelectStyles };

// ── Page Picker ────────────────────────────────────────────────────────

export function PagePickerSelect({
  label,
  value,
  onChange,
  disabled,
  clientId,
}: {
  label: ReactNode;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  clientId?: string;
}) {
  const [pages, setPages] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAllEntries('page')
      .then(res => {
        if (res.data?.items) {
          const items = clientId
            ? res.data.items.filter(e => e.data?.clientId === clientId)
            : res.data.items;
          setPages(
            items.map(e => ({
              value: (e.data?.slug as string) || e._id || '',
              label: (e.data?.title as string) || e._id || 'Untitled',
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  return (
    <div>
      {label}
      <Select<SelectOption>
        options={pages}
        value={pages.find(p => p.value === value) ?? null}
        onChange={opt => onChange(opt?.value ?? undefined)}
        isLoading={loading}
        isDisabled={disabled}
        placeholder="Select page…"
        classNamePrefix="rs"
        styles={pickerSelectStyles}
      />
    </div>
  );
}

// ── Schema Picker ────────────────────────────────────────────────────────

export function SchemaPickerSelect({
  label,
  value,
  onChange,
  disabled,
}: {
  label: ReactNode;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}) {
  const [schemas, setSchemas] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAllSchemas()
      .then(res => {
        if (res.data) {
          setSchemas(res.data.map(s => ({ value: s.slug, label: s.name })));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {label}
      <Select<SelectOption>
        options={schemas}
        value={schemas.find(s => s.value === value) ?? null}
        onChange={opt => onChange(opt?.value ?? undefined)}
        isLoading={loading}
        isDisabled={disabled}
        placeholder="Select schema…"
        classNamePrefix="rs"
        styles={pickerSelectStyles}
      />
    </div>
  );
}

// ── Field Picker ────────────────────────────────────────────────────────

export function FieldPickerSelect({
  label,
  value,
  onChange,
  disabled,
  schemaSlug,
}: {
  label: ReactNode;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  schemaSlug?: string;
}) {
  const [fields, setFields] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schemaSlug) {
      setFields([]);
      return;
    }

    setLoading(true);
    getAllSchemas()
      .then(res => {
        if (res.data) {
          const schema = res.data.find(s => s.slug === schemaSlug);
          if (schema) {
            setFields(schema.fields.map(f => ({ value: f.name, label: f.label })));
          }
        }
      })
      .finally(() => setLoading(false));
  }, [schemaSlug]);

  return (
    <div>
      {label}
      {!schemaSlug ? (
        <div className="p-2 bg-surface-container border-2 border-on-surface">
          <Text variant="caption" color="secondary">Select a schema first</Text>
        </div>
      ) : (
        <Select<SelectOption>
          options={fields}
          value={fields.find(f => f.value === value) ?? null}
          onChange={opt => onChange(opt?.value ?? undefined)}
          isLoading={loading}
          isDisabled={disabled || !schemaSlug}
          placeholder="Select field…"
          classNamePrefix="rs"
          styles={pickerSelectStyles}
        />
      )}
    </div>
  );
}

// ── Entry Picker ────────────────────────────────────────────────────────

export function EntryPickerSelect({
  label,
  value,
  onChange,
  disabled,
  schemaSlug,
}: {
  label: ReactNode;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  schemaSlug?: string;
}) {
  const [entries, setEntries] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schemaSlug) {
      setEntries([]);
      return;
    }

    setLoading(true);
    getAllEntries(schemaSlug)
      .then(res => {
        if (res.data?.items) {
          setEntries(
            res.data.items.map(e => ({
              value: e._id ?? '',
              label: (e.data?.title as string) || e._id || 'Untitled',
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, [schemaSlug]);

  return (
    <div>
      {label}
      {!schemaSlug ? (
        <div className="p-2 bg-surface-container border-2 border-on-surface">
          <Text variant="caption" color="secondary">Select a schema first</Text>
        </div>
      ) : (
        <Select<SelectOption>
          options={entries}
          value={entries.find(e => e.value === value) ?? null}
          onChange={opt => onChange(opt?.value ?? undefined)}
          isLoading={loading}
          isDisabled={disabled || !schemaSlug}
          placeholder="Select entry…"
          classNamePrefix="rs"
          styles={pickerSelectStyles}
        />
      )}
    </div>
  );
}

// ── Field Picker Multi (Multi-Select) ─────────────────────────────────────

export function FieldPickerMultiSelect({
  label,
  value,
  onChange,
  disabled,
  schemaSlug,
}: {
  label: ReactNode;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  schemaSlug?: string;
}) {
  const [fields, setFields] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schemaSlug) {
      setFields([]);
      return;
    }

    setLoading(true);
    getAllSchemas()
      .then(res => {
        if (res.data) {
          const schema = res.data.find(s => s.slug === schemaSlug);
          if (schema) {
            setFields(schema.fields.map(f => ({ value: f.name, label: f.label })));
          }
        }
      })
      .finally(() => setLoading(false));
  }, [schemaSlug]);

  const selectedValues = Array.isArray(value) ? value : [];
  const selectedOptions = selectedValues
    .map(v => fields.find(f => f.value === v))
    .filter((f): f is SelectOption => f !== undefined);

  return (
    <div>
      {label}
      {!schemaSlug ? (
        <div className="p-2 bg-surface-container border-2 border-on-surface">
          <Text variant="caption" color="secondary">Select a schema first</Text>
        </div>
      ) : (
        <Select<SelectOption, true>
          isMulti
          options={fields}
          value={selectedOptions}
          onChange={opts => onChange(opts ? opts.map(o => o.value) : [])}
          isLoading={loading}
          isDisabled={disabled || !schemaSlug}
          placeholder="Select fields… (empty = all fields)"
          classNamePrefix="rs"
          styles={pickerSelectStyles}
        />
      )}
    </div>
  );
}
