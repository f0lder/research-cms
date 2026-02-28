'use client';
import { useState } from 'react';
import { FieldType, FieldDefinition } from '@research-cms/shared-types';
import { API_URL } from '../../../config';

export default function CreateSchemaPage() {
	const [name, setName] = useState('');
	const [slug, setSlug] = useState('');
	const [fields, setFields] = useState<FieldDefinition[]>([]);
	const [error, setError] = useState('');

	const addField = () => {
		setFields([...fields, {
			name: '',
			label: '',
			type: FieldType.TEXT,
			required: false
		}]);
	};

	const removeField = (index: number) => {
		setFields(fields.filter((_, i) => i !== index));
	};

	const updateField = (index: number, key: keyof FieldDefinition, value: string | boolean) => {
		const updated = [...fields];
		updated[index] = { ...updated[index], [key]: value };
		setFields(updated);
	};

	const saveSchema = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		try {
			const res = await fetch(`${API_URL}/schemas`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, slug, fields })
			});

			if (!res.ok) {
				const err = await res.json();
				setError(err.message || 'Failed to create schema');
				return;
			}

			window.location.href = '/schemas';
		} catch (err) {
			setError('Network error - is API running?');
		}
	};

	return (
		<div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
			<h1>Create Content Type</h1>

			{error && (
				<div style={{ padding: '10px', background: '#fee', border: '1px solid #f00', marginBottom: '20px' }}>
					{error}
				</div>
			)}

			<form onSubmit={saveSchema} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
					<label style={{ fontWeight: 'bold' }}>Schema Name</label>
					<input
						required
						value={name}
						onChange={e => setName(e.target.value)}
						style={{ padding: '8px', fontSize: '14px' }}
						placeholder="e.g., Product"
					/>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
					<label style={{ fontWeight: 'bold' }}>URL Slug</label>
					<input
						required
						value={slug}
						onChange={e => setSlug(e.target.value)}
						style={{ padding: '8px', fontSize: '14px' }}
						placeholder="e.g., product"
					/>
				</div>

				<div>
					<h3>Fields</h3>
					{fields.length === 0 && (
						<p style={{ color: '#666' }}>No fields defined. Click "Add Field" to start.</p>
					)}

					{fields.map((field, i) => (
						<div
							key={i}
							style={{
								border: '1px solid #ccc',
								padding: '15px',
								marginBottom: '10px',
								display: 'flex',
								flexDirection: 'column',
								gap: '10px'
							}}
						>
							<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
								<input
									placeholder="Field name (e.g., title)"
									required
									value={field.name}
									onChange={e => updateField(i, 'name', e.target.value)}
									style={{ flex: 1, padding: '6px' }}
								/>
								<input
									placeholder="Label (e.g., Product Title)"
									required
									value={field.label}
									onChange={e => updateField(i, 'label', e.target.value)}
									style={{ flex: 1, padding: '6px' }}
								/>
							</div>

							<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
								<select
									value={field.type}
									onChange={e => updateField(i, 'type', e.target.value as FieldType)}
									style={{ padding: '6px', flex: 1 }}
								>
									<option value={FieldType.TEXT}>Text</option>
									<option value={FieldType.NUMBER}>Number</option>
									<option value={FieldType.BOOLEAN}>Boolean</option>
									<option value={FieldType.IMAGE}>Image URL</option>
								</select>

								<label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
									<input
										type="checkbox"
										checked={field.required}
										onChange={e => updateField(i, 'required', e.target.checked)}
									/>
									Required
								</label>

								<button
									type="button"
									onClick={() => removeField(i)}
									style={{ padding: '6px 12px', background: '#f00', color: '#fff' }}
								>
									Remove
								</button>
							</div>
						</div>
					))}

					<button
						type="button"
						onClick={addField}
						style={{ padding: '10px 20px', marginTop: '10px' }}
					>
						+ Add Field
					</button>
				</div>

				<button
					type="submit"
					style={{
						padding: '15px',
						background: '#000',
						color: '#fff',
						fontSize: '16px',
						cursor: 'pointer'
					}}
				>
					Create Schema
				</button>
			</form>
		</div>
	);
}