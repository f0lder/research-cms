'use client';
import { FieldType, FieldDefinition } from '@research-cms/shared-types';

interface FieldInputProps {
	field: FieldDefinition;
	index: number;
	disabled?: boolean;
	onUpdate: (index: number, key: keyof FieldDefinition, value: string | boolean) => void;
	onRemove: (index: number) => void;
}

export default function FieldInput({
	field,
	index,
	disabled = false,
	onUpdate,
	onRemove
}: FieldInputProps) {

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
					<select
						value={field.type}
						onChange={e => onUpdate(index, 'type', e.target.value as FieldType)}
						disabled={disabled}
						style={{
							padding: '8px',
							fontSize: '14px',
							border: '1px solid #ddd',
							backgroundColor: disabled ? '#f9f9f9' : '#fff'
						}}
					>
						<option value={FieldType.TEXT}>Text</option>
						<option value={FieldType.NUMBER}>Number</option>
						<option value={FieldType.BOOLEAN}>Boolean</option>
						<option value={FieldType.IMAGE}>Image URL</option>
					</select>
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

			{/* Field metadata - can be extended */}
			<div style={{ fontSize: '12px', color: '#999', borderTop: '1px solid #eee', paddingTop: '8px' }}>
				Database key: <code style={{ background: '#f0f0f0', padding: '2px 6px' }}>{field.name || '(empty)'}</code>
			</div>
		</div>
	);
}