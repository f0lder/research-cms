'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ContentTypeDefinition, ContentEntry } from '@research-cms/shared-types';
import { getSchema, getEntry } from '../../../../../../lib/utils';
import ContentForm from '../../../../../../components/content/ContentForm';

export default function ContentEditPage() {
	const params = useParams();
	const router = useRouter();
	const slug = params?.slug ? (Array.isArray(params.slug) ? params.slug[0] : params.slug) : '';
	const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';

	const [schema, setSchema] = useState<ContentTypeDefinition | null>(null);
	const [entry, setEntry] = useState<ContentEntry | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!slug || !id) return;
		Promise.all([getSchema(slug), getEntry(slug, id)]).then(([schemaRes, entryRes]) => {
			if (schemaRes.error) { setError(schemaRes.error); setLoading(false); return; }
			if (entryRes.error) { setError(entryRes.error); setLoading(false); return; }
			if (schemaRes.data) setSchema(schemaRes.data);
				if (entryRes.data) setEntry(entryRes.data);
			setLoading(false);
		});
	}, [slug, id]);

	if (loading) return <div style={{ padding: '20px' }}>Loading…</div>;

	if (error || !schema || !entry) {
		return (
			<div style={{ padding: '20px' }}>
				<div style={{ padding: '10px', background: '#fee', border: '1px solid #f00' }}>
					{error || 'Entry not found'}
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
				{' / Edit entry'}
			</p>

			<h1 style={{ marginBottom: '24px' }}>Edit {schema.name}</h1>

			<ContentForm
				mode="edit"
				schema={schema}
				initialData={entry}
				onSuccess={() => router.push(`/schemas/${slug}`)}
			/>
		</div>
	);
}
