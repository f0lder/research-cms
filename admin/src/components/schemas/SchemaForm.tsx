'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FieldType, FieldDefinition, FieldConfig, ContentTypeDefinition } from '@research-cms/shared-types';
import { api, generateSlugFromName, validateSlug, getErrorMessage } from '../../lib/utils';
import FieldInput from './FieldInput';

interface SchemaFormProps {
	mode: 'create' | 'edit';
	initialData?: ContentTypeDefinition;
	onSuccess?: () => void;
}

export default function SchemaForm({ mode, initialData, onSuccess }: SchemaFormProps) {
	const router = useRouter();

	const [name, setName] = useState(initialData?.name || '');
	const [slug, setSlug] = useState(initialData?.slug || '');
	const [fields, setFields] = useState<FieldDefinition[]>(initialData?.fields || []);
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [manualSlugEdit, setManualSlugEdit] = useState(false);

	const handleNameChange = (value: string) => {
		setName(value);
		if (!manualSlugEdit && mode === 'create') {
			setSlug(generateSlugFromName(value));
		}
	};

	const handleSlugChange = (value: string) => {
		setSlug(value);
		setManualSlugEdit(true);
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

	const updateField = (index: number, key: keyof FieldDefinition, value: string | boolean | FieldConfig | undefined) => {
		setFields(prev => {
			const updated = [...prev];
			updated[index] = { ...updated[index], [key]: value };
			return updated;
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		// Validate slug
		const slugValidation = validateSlug(slug);
		if (!slugValidation.valid) {
			setError(slugValidation.error!);
			return;
		}

		// Validate fields
		if (fields.length === 0) {
			setError('At least one field is required');
			return;
		}

		// Check for duplicate field names
		const fieldNames = fields.map(f => f.name);
		const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
		if (duplicates.length > 0) {
			setError(`Duplicate field names: ${duplicates.join(', ')}`);
			return;
		}

		setIsSubmitting(true);

		try {
			if (mode === 'create') {
				const { data, error } = await api.post('/schemas', { name, slug, fields });
				if (error) {
					setError(error);
					setIsSubmitting(false);
					return;
				}
			} else {
				const { data, error } = await api.put(`/schemas/${initialData?.slug}`, { name, slug, fields });
				if (error) {
					setError(error);
					setIsSubmitting(false);
					return;
				}
			}

			if (onSuccess) {
				onSuccess();
			} else {
				router.push('/schemas');
			}
		} catch (err) {
			setError(getErrorMessage(err));
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm('Delete this schema? This cannot be undone.')) return;

		setIsSubmitting(true);
		const { error } = await api.delete(`/schemas/${initialData?.slug}`);

		if (error) {
			setError(error);
			setIsSubmitting(false);
			return;
		}

		router.push('/schemas');
	};

	return (
		<div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
				<h1>{mode === 'create' ? 'Create Content Type' : 'Edit Content Type'}</h1>
				{mode === 'edit' && (
					<button
						type="button"
						onClick={handleDelete}
						disabled={isSubmitting}
						style={{
							padding: '10px 20px',
							background: '#f00',
							color: '#fff',
							cursor: isSubmitting ? 'not-allowed' : 'pointer',
							opacity: isSubmitting ? 0.5 : 1
						}}
					>
						Delete Schema
					</button>
				)}
			</div>

			{error && (
				<div style={{ padding: '10px', background: '#fee', border: '1px solid #f00', marginBottom: '20px' }}>
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
					<label style={{ fontWeight: 'bold' }}>Schema Name *</label>
					<input
						required
						value={name}
						onChange={e => handleNameChange(e.target.value)}
						disabled={isSubmitting}
						style={{ padding: '8px', fontSize: '14px' }}
						placeholder="e.g., Product"
					/>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
					<label style={{ fontWeight: 'bold' }}>URL Slug *</label>
					<input
						required
						value={slug}
						onChange={e => handleSlugChange(e.target.value)}
						disabled={isSubmitting}
						style={{ padding: '8px', fontSize: '14px' }}
						placeholder="e.g., product"
					/>
					<small style={{ color: '#666' }}>Lowercase letters, numbers, and dashes only</small>
				</div>

				<div>
					<h3>Fields</h3>
					{fields.length === 0 && (
						<p style={{ color: '#666' }}>No fields defined. Click "Add Field" to start.</p>
					)}

					{fields.map((field, i) => (
						<FieldInput
							key={i}
							index={i}
							field={field}
							onUpdate={updateField}
							onRemove={removeField}
							disabled={isSubmitting}
						/>
					))}

					<button
						type="button"
						onClick={addField}
						disabled={isSubmitting}
						style={{
							padding: '10px 20px',
							marginTop: '10px',
							cursor: isSubmitting ? 'not-allowed' : 'pointer',
							opacity: isSubmitting ? 0.5 : 1
						}}
					>
						+ Add Field
					</button>
				</div>

				<div style={{ display: 'flex', gap: '10px' }}>
					<button
						type="submit"
						disabled={isSubmitting}
						style={{
							flex: 1,
							padding: '15px',
							background: '#000',
							color: '#fff',
							fontSize: '16px',
							cursor: isSubmitting ? 'not-allowed' : 'pointer',
							opacity: isSubmitting ? 0.5 : 1
						}}
					>
						{isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Schema' : 'Update Schema'}
					</button>
					<button
						type="button"
						onClick={() => router.push('/schemas')}
						disabled={isSubmitting}
						style={{
							padding: '15px 30px',
							background: '#ccc',
							cursor: isSubmitting ? 'not-allowed' : 'pointer',
							opacity: isSubmitting ? 0.5 : 1
						}}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}