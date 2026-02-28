import Link from 'next/link';
import { API_URL } from '../../config';

async function getSchemas() {
	try {
		const res = await fetch(`${API_URL}/schemas`, { cache: 'no-store' });
		if (!res.ok) return [];
		return res.json();
	} catch (e) {
		return [];
	}
}

export default async function SchemasPage() {
	const schemas = await getSchemas();

	return (
		<div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
				<h1>Content Types</h1>
				<Link href="/schemas/create">
					<button style={{
						padding: '12px 24px',
						background: '#000',
						color: '#fff',
						cursor: 'pointer'
					}}>
						+ New Schema
					</button>
				</Link>
			</div>

			{schemas.length === 0 ? (
				<div style={{ padding: '40px', textAlign: 'center', border: '2px dashed #ccc' }}>
					<p>No schemas created yet.</p>
					<Link href="/schemas/create">
						<button style={{ padding: '10px 20px', marginTop: '10px' }}>
							Create Your First Schema
						</button>
					</Link>
				</div>
			) : (
				<div style={{ display: 'grid', gap: '15px' }}>
					{schemas.map((schema: any) => (
						<div
							key={schema._id}
							style={{
								border: '1px solid #ccc',
								padding: '20px',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'start'
							}}
						>
							<div>
								<h3 style={{ margin: '0 0 5px 0' }}>{schema.name}</h3>
								<p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
									Slug: /{schema.slug}
								</p>
								<p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
									{schema.fields.length} field{schema.fields.length !== 1 ? 's' : ''}
								</p>
							</div>
							<div style={{ fontSize: '12px', color: '#999' }}>
								{new Date(schema.createdAt).toLocaleDateString()}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}