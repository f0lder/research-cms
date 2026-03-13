'use client';
import { useState } from 'react';
import { ContentTypeDefinition, ContentEntry, FieldType, FieldValue } from '@research-cms/shared-types';
import { createEntry, updateEntry } from '../../lib/utils';
import DynamicFieldInput from './DynamicFieldInput';

interface ContentFormProps {
	mode: 'create' | 'edit';
	schema: ContentTypeDefinition;
	initialData?: ContentEntry;
	onSuccess?: () => void;
}

function buildDefaults(schema: ContentTypeDefinition, initial?: ContentEntry): Record<string, FieldValue> {
	const defaults: Record<string, FieldValue> = {};
	for (const field of schema.fields) {
		if (initial?.data && field.name in initial.data) {
			defaults[field.name] = initial.data[field.name];
		} else if (field.type === FieldType.BOOLEAN) {
			defaults[field.name] = false;
		} else if (field.type === FieldType.TAGS || field.type === FieldType.REFERENCES) {
			defaults[field.name] = [];
		} else {
			defaults[field.name] = '';
		}
	}
	return defaults;
}

export default function ContentForm({ mode, schema, initialData, onSuccess }: ContentFormProps) {
	const [formData, setFormData] = useState<Record<string, FieldValue>>(
		() => buildDefaults(schema, initialData)
	);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleFieldChange = (name: string, value: FieldValue) => {
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError(null);

		const result =
			mode === 'create'
				? await createEntry(schema.slug, formData)
				: await updateEntry(schema.slug, initialData?._id ?? '', formData);

		setSaving(false);

		if (result.error) {
			setError(result.error);
			return;
		}

		onSuccess?.();
	};

	const labelStyle: React.CSSProperties = {
		display: 'block',
		fontWeight: 500,
		marginBottom: '4px',
		fontSize: '14px',
	};

	const fieldWrap: React.CSSProperties = {
		marginBottom: '20px',
	};

	const requiredMark: React.CSSProperties = {
		color: '#e53e3e',
		marginLeft: '3px',
	};

	return (
		<form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
			{schema.fields.length === 0 && (
				<p style={{ color: '#888', fontStyle: 'italic' }}>This schema has no fields defined yet.</p>
			)}

			{schema.fields.map(field => (
				<div key={field.name} style={fieldWrap}>
					{/* Boolean renders its own label */}
					{field.type !== FieldType.BOOLEAN && (
						<label style={labelStyle}>
							{field.label}
							{field.required && <span style={requiredMark}>*</span>}
						</label>
					)}
					<DynamicFieldInput
						field={field}
						value={formData[field.name]}
						onChange={handleFieldChange}
						disabled={saving}
					/>
				</div>
			))}

			{error && (
				<p style={{ color: '#e53e3e', marginBottom: '16px', fontSize: '14px' }}>{error}</p>
			)}

			<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
				<button
					type="submit"
					disabled={saving}
					style={{
						padding: '9px 22px',
						background: saving ? '#aaa' : '#0070f3',
						color: '#fff',
						border: 'none',
						borderRadius: '4px',
						cursor: saving ? 'not-allowed' : 'pointer',
						fontWeight: 600,
						fontSize: '14px',
					}}
				>
					{saving ? 'Saving…' : mode === 'create' ? 'Create entry' : 'Save changes'}
				</button>

				<button
					type="button"
					onClick={() => history.back()}
					disabled={saving}
					style={{
						padding: '9px 18px',
						background: 'transparent',
						border: '1px solid #ccc',
						borderRadius: '4px',
						cursor: saving ? 'not-allowed' : 'pointer',
						fontSize: '14px',
					}}
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
