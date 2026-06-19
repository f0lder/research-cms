'use client';

import { ReactNode } from 'react';
import ReactSelect from 'react-select';

export interface SelectOption {
  value: string;
  label: string;
}

/** Shared neo-brutalist react-select styling used across all pickers/selects. */
export const pickerSelectStyles = {
  control: (base: any) => ({ ...base, minHeight: 32, fontSize: 12, fontFamily: 'ui-monospace, monospace', borderColor: '#000', borderWidth: 2, borderRadius: 0, boxShadow: 'none', '&:hover': { borderColor: '#000' } }),
  menu: (base: any) => ({ ...base, fontSize: 12, fontFamily: 'ui-monospace, monospace', borderRadius: 0, zIndex: 30, border: '2px solid #000', boxShadow: '4px 4px 0 #000' }),
  option: (base: any, s: any) => ({ ...base, backgroundColor: s.isFocused ? '#f4f4f5' : 'white', color: '#000', fontSize: 12 }),
  multiValue: (base: any) => ({ ...base, backgroundColor: '#f4f4f5', borderRadius: 0, border: '1px solid #000' }),
  multiValueLabel: (base: any) => ({ ...base, fontSize: 11, fontFamily: 'ui-monospace, monospace' }),
};

export interface SelectFieldProps {
  /** Either ready-made options, or plain string values (label === value). */
  options: (SelectOption | string)[];
  value: string | null | undefined;
  onChange: (value: string) => void;
  label?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  isClearable?: boolean;
  isLoading?: boolean;
  /** Helper text shown under the field. */
  hint?: ReactNode;
  /** Extra class on the wrapper. */
  className?: string;
}

function normalize(options: (SelectOption | string)[]): SelectOption[] {
  return options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
}

/**
 * Styled single-select dropdown (react-select) matching the design system.
 * Drop-in replacement for native `<select>` — `value`/`onChange` work with strings.
 */
export function SelectField({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select…',
  disabled,
  isClearable,
  isLoading,
  hint,
  className = '',
}: SelectFieldProps) {
  const opts = normalize(options);
  const selected = opts.find(o => o.value === value) ?? null;

  return (
    <div className={`w-full ${className}`}>
      {typeof label === 'string' ? (
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{label}</label>
      ) : (
        label
      )}
      <ReactSelect<SelectOption>
        options={opts}
        value={selected}
        onChange={opt => onChange(opt?.value ?? '')}
        isDisabled={disabled}
        isClearable={isClearable}
        isLoading={isLoading}
        placeholder={placeholder}
        classNamePrefix="rs"
        styles={pickerSelectStyles}
      />
      {hint && <p className="field-hint normal-case tracking-normal">{hint}</p>}
    </div>
  );
}
