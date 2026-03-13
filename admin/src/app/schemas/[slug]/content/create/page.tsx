'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { getSchema } from '../../../../../lib/utils';
import ContentForm from '../../../../../components/content/ContentForm';

export default function ContentCreatePage() {
	const params = useParams();
	const router = useRouter();
	const slug = params?.slug ? (Array.isArray(params.slug) ? params.slug[0] : params.slug) : '';

	const [schema, setSchema] = useState<ContentTypeDefinition | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!slug) return;
		getSchema(slug).then(({ data, error: err }) => {
			if (err) setError(err);
			else if (data) setSchema(data);
			setLoading(false);
		});
	}, [slug]);

	if (loading) return <div style={{ padding: '20px' }}>Loading…</div>;

	if (error || !schema) {
		return (
			<div style={{ padding: '20px' }}>
				<div style={{ padding: '10px', background: '#fee', border: '1px solid #f00' }}>
					{error || 'Schema not found'}
				</div>
			</div>
		);
	}

	return (
		<div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
			<p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
				<Link href="/schemas" style={{ color: '#0070f3' }}>Content Types</Link>
				{' / '}
				<Link href={`/schemas/${slug}`} style={{ color: '#0070f3' }}>{schema.name}</Link>
				{' / New entry'}
			</p>

			<h1 style={{ marginBottom: '24px' }}>New {schema.name}</h1>

			<ContentForm
				mode="create"
				schema={schema}
				onSuccess={() => router.push(`/schemas/${slug}`)}
			/>
		</div>
	);
}
