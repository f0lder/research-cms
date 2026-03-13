'use client';
import { useEffect, useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { FieldDefinition, FieldType, FieldValue, ContentEntry } from '@research-cms/shared-types';
import { getAllEntries } from '../../lib/utils';

interface DynamicFieldInputProps {
	field: FieldDefinition;
	value: FieldValue;
	onChange: (name: string, value: FieldValue) => void;
	disabled?: boolean;
}

type SelectOption = { value: string; label: string };

export default function DynamicFieldInput({
	field,
	value,
	onChange,
	disabled = false,
}: DynamicFieldInputProps) {
	const [referenceOptions, setReferenceOptions] = useState<SelectOption[]>([]);
	const [referenceLoading, setReferenceLoading] = useState(false);

	// Fetch options for reference / references fields
	useEffect(() => {
		const targetSlug =
			field.config?.type === 'reference' || field.config?.type === 'references'
				? field.config.targetSlug
				: null;

		if (!targetSlug) return;

		setReferenceLoading(true);
		getAllEntries(targetSlug).then(({ data }) => {
			if (data) {
				setReferenceOptions(
					data.map(entry => ({
						value: entry._id ?? '',
					// filter out entries with no ID (shouldn't happen in practice)
						// Use the first string field as the label, fallback to ID
						label: getEntryLabel(entry),
					}))
				);
			}
			setReferenceLoading(false);
		});
	}, [field.config]);

	const inputStyle = {
		padding: '8px',
		fontSize: '14px',
		border: '1px solid #ddd',
		width: '100%',
		boxSizing: 'border-box' as const,
		backgroundColor: disabled ? '#f9f9f9' : '#fff',
	};

	const selectStyles = {
		control: (base: object) => ({
			...base,
			fontSize: '14px',
			backgroundColor: disabled ? '#f9f9f9' : '#fff',
		}),
	};

	switch (field.type as FieldType) {
		case FieldType.TEXTAREA:
			return (
				<textarea
					value={String(value ?? '')}
					onChange={e => onChange(field.name, e.target.value)}
					disabled={disabled}
					rows={4}
					style={{ ...inputStyle, resize: 'vertical' }}
				/>
			);

		case FieldType.NUMBER:
			return (
				<input
					type="number"
					value={String(value ?? '')}
					onChange={e => onChange(field.name, e.target.value === '' ? '' : Number(e.target.value))}
					disabled={disabled}
					style={inputStyle}
				/>
			);

		case FieldType.BOOLEAN:
			return (
				<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: disabled ? 'not-allowed' : 'pointer' }}>
					<input
						type="checkbox"
						checked={Boolean(value)}
						onChange={e => onChange(field.name, e.target.checked)}
						disabled={disabled}
					/>
					<span style={{ fontSize: '14px' }}>{field.label}</span>
				</label>
			);

		case FieldType.DATE:
			return (
				<input
					type="date"
					value={String(value ?? '')}
					onChange={e => onChange(field.name, e.target.value)}
					disabled={disabled}
					style={inputStyle}
				/>
			);

		case FieldType.DATETIME:
			return (
				<input
					type="datetime-local"
					value={String(value ?? '')}
					onChange={e => onChange(field.name, e.target.value)}
					disabled={disabled}
					style={inputStyle}
				/>
			);

		case FieldType.EMAIL:
			return (
				<input
					type="email"
					value={String(value ?? '')}
					onChange={e => onChange(field.name, e.target.value)}
					disabled={disabled}
					style={inputStyle}
				/>
			);

		case FieldType.URL:
			return (
				<input
					type="url"
					value={String(value ?? '')}
					onChange={e => onChange(field.name, e.target.value)}
					disabled={disabled}
					placeholder="https://"
					style={inputStyle}
				/>
			);

		case FieldType.IMAGE:
			return (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
					<input
						type="url"
						value={String(value ?? '')}
						onChange={e => onChange(field.name, e.target.value)}
						disabled={disabled}
						placeholder="https://..."
						style={inputStyle}
					/>
					{Boolean(value) && (
						<img
							src={String(value)}
							alt="preview"
							style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain', border: '1px solid #eee' }}
							onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
						/>
					)}
				</div>
			);

		case FieldType.SELECT: {
			const options = field.config?.type === 'select'
				? field.config.options.map(o => ({ value: o, label: o }))
				: [];
			return (
				<Select<SelectOption>
					instanceId={`content-select-${field.name}`}
					options={options}
					value={options.find(o => o.value === value) ?? null}
					onChange={opt => onChange(field.name, opt?.value ?? '')}
					isDisabled={disabled}
					isClearable
					placeholder="Choose…"
					styles={selectStyles}
				/>
			);
		}

		case FieldType.TAGS: {
			const tagValues: SelectOption[] = Array.isArray(value)
				? (value as string[]).map(v => ({ value: v, label: v }))
				: [];
			return (
				<CreatableSelect<SelectOption, true>
					instanceId={`content-tags-${field.name}`}
					isMulti
					value={tagValues}
					onChange={newVals => onChange(field.name, newVals.map(v => v.value))}
					isDisabled={disabled}
					placeholder="Type and press Enter…"
					noOptionsMessage={() => 'Type to add a tag'}
					components={{ DropdownIndicator: null }}
					styles={{
						...selectStyles,
						multiValue: (base: object) => ({ ...base, backgroundColor: '#e8f0fe' }),
					}}
				/>
			);
		}

		case FieldType.REFERENCE: {
			const refValue = referenceOptions.find(o => o.value === value) ?? null;
			return (
				<Select<SelectOption>
					instanceId={`content-ref-${field.name}`}
					options={referenceOptions}
					value={refValue}
					onChange={opt => onChange(field.name, opt?.value ?? '')}
					isDisabled={disabled || referenceLoading}
					isLoading={referenceLoading}
					isClearable
					isSearchable
					placeholder={referenceLoading ? 'Loading…' : 'Search entries…'}
					styles={selectStyles}
				/>
			);
		}

		case FieldType.REFERENCES: {
			const refValues = Array.isArray(value)
				? referenceOptions.filter(o => (value as string[]).includes(o.value))
				: [];
			return (
				<Select<SelectOption, true>
					instanceId={`content-refs-${field.name}`}
					isMulti
					options={referenceOptions}
					value={refValues}
					onChange={newVals => onChange(field.name, newVals.map(v => v.value))}
					isDisabled={disabled || referenceLoading}
					isLoading={referenceLoading}
					isSearchable
					placeholder={referenceLoading ? 'Loading…' : 'Search entries…'}
					styles={{
						...selectStyles,
						multiValue: (base: object) => ({ ...base, backgroundColor: '#e8f0fe' }),
					}}
				/>
			);
		}

		// text, url (default)
		default:
			return (
				<input
					type="text"
					value={String(value ?? '')}
					onChange={e => onChange(field.name, e.target.value)}
					disabled={disabled}
					style={inputStyle}
				/>
			);
	}
}

/** Pick the first non-empty string field value as a human label, fallback to ID. */
function getEntryLabel(entry: ContentEntry): string {
	for (const val of Object.values(entry.data)) {
		if (typeof val === 'string' && val.trim()) return val;
	}
	return entry._id ?? '(no label)';
}
