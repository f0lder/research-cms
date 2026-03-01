'use client';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { FieldType, FieldDefinition, FieldConfig, ContentTypeDefinition } from '@research-cms/shared-types';

type SelectOption = { value: string; label: string };

const FIELD_TYPE_OPTIONS = [
	{ label: 'Text',       options: [
		{ value: FieldType.TEXT,     label: 'Text' },
		{ value: FieldType.TEXTAREA, label: 'Textarea' },
		{ value: FieldType.EMAIL,    label: 'Email' },
		{ value: FieldType.URL,      label: 'URL' },
	]},
	{ label: 'Numeric',    options: [
		{ value: FieldType.NUMBER,   label: 'Number' },
	]},
	{ label: 'Date / Time', options: [
		{ value: FieldType.DATE,     label: 'Date' },
		{ value: FieldType.DATETIME, label: 'Date & Time' },
	]},
	{ label: 'Toggle',     options: [
		{ value: FieldType.BOOLEAN,  label: 'Boolean' },
	]},
	{ label: 'Media',      options: [
		{ value: FieldType.IMAGE,    label: 'Image URL' },
	]},
	{ label: 'Choice',     options: [
		{ value: FieldType.SELECT,      label: 'Select' },
		{ value: FieldType.TAGS,        label: 'Tags' },
	]},
	{ label: 'Relations',  options: [
		{ value: FieldType.REFERENCE,   label: 'Reference (one)' },
		{ value: FieldType.REFERENCES,  label: 'References (many)' },
	]},
];

interface FieldInputProps {
	field: FieldDefinition;
	index: number;
	disabled?: boolean;
	availableSchemas?: ContentTypeDefinition[];
	currentSlug?: string;
	onUpdate: (index: number, key: keyof FieldDefinition, value: string | boolean | FieldConfig | undefined) => void;
	onRemove: (index: number) => void;
}

export default function FieldInput({
	field,
	index,
	disabled = false,
	availableSchemas = [],
	currentSlug,
	onUpdate,
	onRemove
}: FieldInputProps) {

	const handleTypeChange = (newType: FieldType) => {
		onUpdate(index, 'type', newType);
		if (newType === FieldType.SELECT) {
			onUpdate(index, 'config', { type: 'select', options: [] });
		} else if (newType === FieldType.TAGS) {
			onUpdate(index, 'config', { type: 'tags' });
		} else if (newType === FieldType.REFERENCE) {
			onUpdate(index, 'config', { type: 'reference', targetSlug: '' });
		} else if (newType === FieldType.REFERENCES) {
			onUpdate(index, 'config', { type: 'references', targetSlug: '' });
		} else {
			onUpdate(index, 'config', undefined);
		}
	};

	// Schema options for reference pickers: "self" + all known schemas
	const schemaOptions: SelectOption[] = [
		...(currentSlug ? [{ value: currentSlug, label: `Self (${currentSlug})` }] : []),
		...availableSchemas
			.filter(s => s.slug !== currentSlug)
			.map(s => ({ value: s.slug, label: `${s.name} (${s.slug})` })),
	];

	const referenceConfig =
		field.config?.type === 'reference' || field.config?.type === 'references'
			? (field.config as { type: 'reference' | 'references'; targetSlug: string })
			: null;

	const referenceTargetValue = referenceConfig?.targetSlug
		? schemaOptions.find(o => o.value === referenceConfig.targetSlug) ?? null
		: null;

	const handleReferenceTargetChange = (opt: SelectOption | null) => {
		if (!opt) return;
		const configType = field.type === FieldType.REFERENCE ? 'reference' : 'references';
		onUpdate(index, 'config', { type: configType, targetSlug: opt.value });
	};

	const currentTypeOption =
		FIELD_TYPE_OPTIONS.flatMap(g => g.options).find(o => o.value === field.type) ?? null;

	const selectOptionValues: SelectOption[] =
		field.config?.type === 'select'
			? field.config.options.map(o => ({ value: o, label: o }))
			: [];

	const handleSelectOptionsChange = (newValues: readonly SelectOption[]) => {
		onUpdate(index, 'config', { type: 'select', options: newValues.map(o => o.value) });
	};

	return (
		<div
			style={{
				border: '1px solid #ccc',
				padding: '15px',
				marginBottom: '10px',
				display: 'flex',
				flexDirection: 'column',
				gap: '10px',
				backgroundColor: disabled ? '#f5f5f5' : '#fff'
			}}
		>
			{/* Field Name and Label Row */}
			<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
				<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
					<label style={{ fontSize: '12px', color: '#666' }}>Field Name *</label>
					<input
						placeholder="e.g., title"
						required
						value={field.name}
						onChange={e => onUpdate(index, 'name', e.target.value)}
						disabled={disabled}
						style={{
							padding: '8px',
							fontSize: '14px',
							border: '1px solid #ddd',
							backgroundColor: disabled ? '#f9f9f9' : '#fff'
						}}
					/>
				</div>

				<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
					<label style={{ fontSize: '12px', color: '#666' }}>Display Label *</label>
					<input
						placeholder="e.g., Product Title"
						required
						value={field.label}
						onChange={e => onUpdate(index, 'label', e.target.value)}
						disabled={disabled}
						style={{
							padding: '8px',
							fontSize: '14px',
							border: '1px solid #ddd',
							backgroundColor: disabled ? '#f9f9f9' : '#fff'
						}}
					/>
				</div>
			</div>

			{/* Field Type, Required, and Remove Row */}
			<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
				<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
					<label style={{ fontSize: '12px', color: '#666' }}>Field Type *</label>
					<Select<SelectOption>
						instanceId={`field-type-${index}`}
						options={FIELD_TYPE_OPTIONS}
						value={currentTypeOption}
						onChange={opt => opt && handleTypeChange(opt.value as FieldType)}
						isDisabled={disabled}
						isSearchable
						placeholder="Select a type…"
						styles={{
							control: base => ({
								...base,
								fontSize: '14px',
								minHeight: '36px',
								backgroundColor: disabled ? '#f9f9f9' : '#fff',
							}),
							groupHeading: base => ({ ...base, fontSize: '11px', textTransform: 'uppercase', color: '#999' }),
						}}
					/>
				</div>

				<div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
					<label style={{
						display: 'flex',
						alignItems: 'center',
						gap: '5px',
						padding: '8px',
						cursor: disabled ? 'not-allowed' : 'pointer'
					}}>
						<input
							type="checkbox"
							checked={field.required}
							onChange={e => onUpdate(index, 'required', e.target.checked)}
							disabled={disabled}
							style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
						/>
						<span style={{ fontSize: '14px' }}>Required</span>
					</label>

					<button
						type="button"
						onClick={() => onRemove(index)}
						disabled={disabled}
						style={{
							padding: '8px 16px',
							background: '#f00',
							color: '#fff',
							border: 'none',
							cursor: disabled ? 'not-allowed' : 'pointer',
							opacity: disabled ? 0.5 : 1,
							fontSize: '14px'
						}}
						title="Remove field"
					>
						Remove
					</button>
				</div>
			</div>

			{/* Reference target — shown for REFERENCE and REFERENCES types */}
			{(field.type === FieldType.REFERENCE || field.type === FieldType.REFERENCES) && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
					<label style={{ fontSize: '12px', color: '#666' }}>
						Target schema *
						{field.type === FieldType.REFERENCES && <span style={{ color: '#999' }}> (many)</span>}
					</label>
					<Select<SelectOption>
						instanceId={`field-ref-${index}`}
						options={schemaOptions}
						value={referenceTargetValue}
						onChange={handleReferenceTargetChange}
						isDisabled={disabled}
						isSearchable
						placeholder={schemaOptions.length === 0 ? 'No schemas available yet…' : 'Choose a schema…'}
						styles={{
							control: base => ({
								...base,
								fontSize: '14px',
								backgroundColor: disabled ? '#f9f9f9' : '#fff',
							}),
						}}
					/>
					{referenceTargetValue === null && field.config && (field.config.type === 'reference' || field.config.type === 'references') && (
						<small style={{ color: '#e00' }}>A target schema is required</small>
					)}
				</div>
			)}

			{/* Select options — only shown for SELECT type */}
			{field.type === FieldType.SELECT && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
					<label style={{ fontSize: '12px', color: '#666' }}>Options *</label>
					<CreatableSelect<SelectOption, true>
						instanceId={`field-options-${index}`}
						isMulti
						value={selectOptionValues}
						onChange={handleSelectOptionsChange}
						isDisabled={disabled}
						placeholder="Type an option and press Enter…"
						noOptionsMessage={() => 'Type to add an option'}
						components={{ DropdownIndicator: null }}
						styles={{
							control: base => ({
								...base,
								fontSize: '14px',
								backgroundColor: disabled ? '#f9f9f9' : '#fff',
							}),
							multiValue: base => ({ ...base, backgroundColor: '#e8f0fe' }),
							multiValueLabel: base => ({ ...base, fontSize: '12px' }),
						}}
					/>
				</div>
			)}

			{/* Field metadata */}
			<div style={{ fontSize: '12px', color: '#999', borderTop: '1px solid #eee', paddingTop: '8px' }}>
				Database key: <code style={{ background: '#f0f0f0', padding: '2px 6px' }}>{field.name || '(empty)'}</code>
			</div>
		</div>
	);
}