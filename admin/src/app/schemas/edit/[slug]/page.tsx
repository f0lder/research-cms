'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { api } from '../../../../lib/utils';
import SchemaForm from '../../../../components/schemas/SchemaForm';

export default function EditSchemaPage() {
	const params = useParams();
	const slug = params?.slug ? (Array.isArray(params.slug) ? params.slug[0] : params.slug) : '';

	const [schema, setSchema] = useState<ContentTypeDefinition | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		if (slug) {
			loadSchema();
		}
	}, [slug]);

	const loadSchema = async () => {
		const { data, error } = await api.get<ContentTypeDefinition>(`/schemas/${slug}`);

		if (error) {
			setError(error);
			setLoading(false);
			return;
		}

		setSchema(data!);
		setLoading(false);
	};

	if (loading) {
		return <div style={{ padding: '20px' }}>Loading...</div>;
	}

	if (error || !schema) {
		return (
			<div style={{ padding: '20px' }}>
				<div style={{ padding: '10px', background: '#fee', border: '1px solid #f00' }}>
					{error || 'Schema not found'}
				</div>
			</div>
		);
	}

	return <SchemaForm mode="edit" initialData={schema} />;
}