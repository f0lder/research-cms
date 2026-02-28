'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FieldType, FieldDefinition, ContentTypeDefinition } from '@research-cms/shared-types';
import { API_URL } from '../../../../config';

export default function EditSchemaPage() {
	const params = useParams();
	const router = useRouter();
	const slug = params.slug as string;

	const [loading, setLoading] = useState(true);
	const [name, setName] = useState('');
	const [newSlug, setNewSlug] = useState('');
	const [fields, setFields] = useState<FieldDefinition[]>([]);
	const [error, setError] = useState('');

	useEffect(() => {
		loadSchema();
	}, [slug]);

	const loadSchema = async () => {
		try {
			const res = await fetch(`${API_URL}/schemas/${slug}`);
			if (!res.ok) {
				setError('Schema not found');
				return;
			}
			const data: ContentTypeDefinition = await res.json();
			setName(data.name);
			setNewSlug(data.slug);
			setFields(data.fields);
			setLoading(false);
		} catch (err) {
			setError('Failed to load schema');
			setLoading(false);
		}
	};

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
			const res = await fetch(`${API_URL}/schemas/${slug}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, slug: newSlug, fields })
			});

			if (!res.ok) {
				const err = await res.json();
				setError(err.message || 'Failed to update schema');
				return;
			}

			router.push('/schemas');
		} catch (err) {
			setError('Network error - is API running?');
		}
	};

	const deleteSchema = async () => {
		if (!confirm('Delete this schema? This cannot be undone.')) return;

		try {
			const res = await fetch(`${API_URL}/schemas/${slug}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				router.push('/schemas');
			} else {
				setError('Failed to delete schema');
			}
		} catch (err) {
			setError('Network error');
		}
	};

	if (loading) {
		return <div style={{ padding: '20px' }}>Loading...</div>;
	}

	return (
		<div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
				<h1>Edit Content Type</h1>
				<button
					type="button"
					onClick={deleteSchema}
					style={{ padding: '10px 20px', background: '#f00', color: '#fff', cursor: 'pointer' }}
				>
					Delete Schema
				</button>
			</div>

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
					/>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
					<label style={{ fontWeight: 'bold' }}>URL Slug</label>
					<input
						required
						value={newSlug}
						onChange={e => setNewSlug(e.target.value)}
						style={{ padding: '8px', fontSize: '14px' }}
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
									placeholder="Field name"
									required
									value={field.name}
									onChange={e => updateField(i, 'name', e.target.value)}
									style={{ flex: 1, padding: '6px' }}
								/>
								<input
									placeholder="Label"
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

				<div style={{ display: 'flex', gap: '10px' }}>
					<button
						type="submit"
						style={{
							flex: 1,
							padding: '15px',
							background: '#000',
							color: '#fff',
							fontSize: '16px',
							cursor: 'pointer'
						}}
					>
						Update Schema
					</button>
					<button
						type="button"
						onClick={() => router.push('/schemas')}
						style={{
							padding: '15px 30px',
							background: '#ccc',
							cursor: 'pointer'
						}}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}