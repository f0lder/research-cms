'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ContentTypeDefinition, ContentEntry } from '@research-cms/shared-types';
import { getSchema, getAllEntries, deleteEntry, formatDate } from '../../../lib/utils';

export default function SchemaDetailPage() {
	const params = useParams();
	const slug = params?.slug ? (Array.isArray(params.slug) ? params.slug[0] : params.slug) : '';

	const [schema, setSchema] = useState<ContentTypeDefinition | null>(null);
	const [entries, setEntries] = useState<ContentEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		const [schemaRes, entriesRes] = await Promise.all([
			getSchema(slug),
			getAllEntries(slug),
		]);

		if (schemaRes.error) {
			setError(schemaRes.error);
			setLoading(false);
			return;
		}

		setSchema(schemaRes.data!);
		setEntries(entriesRes.data ?? []);
		setLoading(false);
	}, [slug]);

	useEffect(() => {
		if (slug) load();
	}, [slug, load]);

	const handleDelete = async (id: string) => {
		if (!confirm('Delete this entry? This cannot be undone.')) return;
		setDeletingId(id);
		const { error: err } = await deleteEntry(slug, id);
		if (err) {
			alert(err);
		} else {
			setEntries(prev => prev.filter(e => e._id !== id));
		}
		setDeletingId(null);
	};

	/** Render entry row — show first 2 string fields as preview */
	const getPreview = (entry: ContentEntry): string => {
		const vals = Object.values(entry.data)
			.filter(v => typeof v === 'string' && v)
			.slice(0, 2);
		return vals.length > 0 ? vals.join(' · ') : '(empty)';
	};

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
		<div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto' }}>
			{/* Breadcrumb */}
			<p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
				<Link href="/schemas" style={{ color: '#0070f3' }}>Content Types</Link>
				{' / '}{schema.name}
			</p>

			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
				<div>
					<h1 style={{ margin: '0 0 4px 0' }}>{schema.name}</h1>
					<span style={{ fontSize: '13px', color: '#888' }}>/{schema.slug} · {schema.fields.length} field{schema.fields.length !== 1 ? 's' : ''}</span>
				</div>
				<div style={{ display: 'flex', gap: '10px' }}>
					<Link href={`/schemas/edit/${slug}`}>
						<button style={{ padding: '9px 18px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>
							Edit schema
						</button>
					</Link>
					<Link href={`/schemas/${slug}/content/create`}>
						<button style={{ padding: '9px 18px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
							+ New entry
						</button>
					</Link>
				</div>
			</div>

			{entries.length === 0 ? (
				<div style={{ padding: '40px', textAlign: 'center', border: '2px dashed #ccc' }}>
					<p style={{ color: '#888' }}>No entries yet.</p>
					<Link href={`/schemas/${slug}/content/create`}>
						<button style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer' }}>
							Create first entry
						</button>
					</Link>
				</div>
			) : (
				<div style={{ display: 'grid', gap: '12px' }}>
					{entries.map(entry => (
						<div
							key={entry._id}
							style={{
								border: '1px solid #ddd',
								padding: '16px 20px',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<div>
								<p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '15px' }}>
									{getPreview(entry)}
								</p>
								<p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
									{entry.createdAt ? formatDate(entry.createdAt as string) : ''}
									{entry._id && <span style={{ marginLeft: '8px' }}>id: {entry._id}</span>}
								</p>
							</div>
							<div style={{ display: 'flex', gap: '8px' }}>
								<Link href={`/schemas/${slug}/content/edit/${entry._id}`}>
									<button style={{ padding: '7px 16px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
										Edit
									</button>
								</Link>
								<button
									onClick={() => handleDelete(entry._id!)}
									disabled={deletingId === entry._id}
									style={{
										padding: '7px 16px',
										background: deletingId === entry._id ? '#aaa' : '#e53e3e',
										color: '#fff',
										border: 'none',
										cursor: deletingId === entry._id ? 'not-allowed' : 'pointer',
										fontSize: '13px',
									}}
								>
									{deletingId === entry._id ? '…' : 'Delete'}
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
