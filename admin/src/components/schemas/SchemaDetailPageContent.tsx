'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { ContentEntry } from '@research-cms/shared-types';
import { getSchema, getAllEntries, getTrash } from '@/app/actions';
import { extractParam } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useEntryList } from '@/contexts/EntryListContext';
import { EntryListPageHeader } from '@/components/content/EntryListPageHeader';
import { TabNavigation } from '@/components/content/TabNavigation';
import { SearchBar } from '@/components/content/SearchBar';
import { EntryListEmptyState } from '@/components/content/EntryListEmptyState';
import { EntryTableToolbar } from '@/components/content/EntryTableToolbar';
import { EntryTable } from '@/components/content/EntryTable';

export function SchemaDetailPageContent() {
	const { user } = useAuth();
	const isAdmin = user?.role === 'admin';
	const params = useParams();
	const slug = extractParam(params, 'slug');

	const {
		schema,
		entries,
		trashEntries,
		tab,
		selected,
		searchQuery,
		searching,
		visibleCols,
		setSlug,
		setSchema,
		setEntries,
		setTrashEntries,
		setSearchQuery,
		setRefCache,
		setVisibleCols,
		handleTabChange,
		handleSearch,
		handleClearSearch,
	} = useEntryList();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const loadingRef = useRef(false);

	useEffect(() => {
		setSlug(slug);
	}, [slug, setSlug]);

	const load = async () => {
		if (loadingRef.current) return;
		loadingRef.current = true;
		setLoading(true);
		const [schemaRes, entriesRes, trashRes] = await Promise.all([
			getSchema(slug),
			getAllEntries(slug),
			getTrash(slug),
		]);
		if (schemaRes.error) {
			setError(schemaRes.error);
			setLoading(false);
			loadingRef.current = false;
			return;
		}
		if (entriesRes.error) {
			setError(entriesRes.error);
			setLoading(false);
			loadingRef.current = false;
			return;
		}
		const schemaData = schemaRes.data ?? null;
		setSchema(schemaData);
		setEntries(entriesRes.data?.items ?? []);
		setTrashEntries(trashRes.data?.items ?? []);

		if (schemaData) {
			const refSlugs = [
				...new Set(
					schemaData.fields
						.filter(f => f.type === 'reference' || f.type === 'references')
						.map(f => (f.config?.type === 'reference' || f.config?.type === 'references') ? f.config.targetSlug : null)
						.filter((s): s is string => !!s)
				),
			];
			const hasMedia = schemaData.fields.some(f => f.type === 'media');
			const slugsToFetch = hasMedia ? [...refSlugs, 'media'] : refSlugs;

			if (slugsToFetch.length > 0) {
				const results = await Promise.all(slugsToFetch.map(s => getAllEntries(s)));
				const cache: Record<string, ContentEntry> = {};
				results.forEach(({ data }) => (data?.items ?? []).forEach(e => { if (e._id) cache[e._id] = e; }));
				setRefCache(cache);
			}
		}
		setLoading(false);
		loadingRef.current = false;
	};

	useEffect(() => {
		if (slug) load();
	}, [slug]);

	// Init visible columns from localStorage once schema is known
	useEffect(() => {
		if (!schema) return;
		const saved = typeof window !== 'undefined'
			? localStorage.getItem(`cms_cols_${schema._id}`)
			: null;
		if (saved) {
			setVisibleCols(JSON.parse(saved) as string[]);
		} else {
			const defaults = [...schema.fields.slice(0, 3).map(f => f.name), 'status', 'date'];
			setVisibleCols(defaults);
		}
	}, [schema, setVisibleCols]);

	if (loading) return <div className="page text-sm text-zinc-400">Loading…</div>;
	if (error || !schema) {
		return <div className="page"><div className="alert-error">{error || 'Schema not found'}</div></div>;
	}

	const visibleFields = schema.fields.filter(f => visibleCols.includes(f.name));
	const showStatus = visibleCols.includes('status');
	const showDate = visibleCols.includes('date');
	const currEntries = tab === 'entries' ? entries : trashEntries;

	const handleSearch_wrapper = async (e: React.FormEvent) => {
		await handleSearch(e);
	};

	return (
		<div className="page">
			<EntryListPageHeader schema={schema} slug={slug} isAdmin={isAdmin} />
			<TabNavigation
				tab={tab}
				entriesCount={entries.length}
				trashCount={trashEntries.length}
				onTabChange={handleTabChange}
			/>

			{tab === 'entries' && (
				<SearchBar
					query={searchQuery}
					onQueryChange={setSearchQuery}
					onSubmit={handleSearch_wrapper}
					searching={searching}
					onClear={() => handleClearSearch(slug)}
				/>
			)}

			{currEntries.length === 0 ? (
				<EntryListEmptyState tab={tab} slug={slug} />
			) : (
				<div className="bg-surface border-2 border-on-surface">
					<EntryTableToolbar
						entriesCount={currEntries.length}
						selectedCount={selected.size}
						tab={tab}
						schema={schema}
					/>
					<EntryTable
						entries={currEntries}
						visibleFields={visibleFields}
						showStatus={showStatus}
						showDate={showDate}
					/>
				</div>
			)}
		</div>
	);
}
