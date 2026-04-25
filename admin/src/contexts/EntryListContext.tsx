'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ContentEntry, ContentTypeDefinition } from '@research-cms/shared-types';
import {
	deleteEntry,
	duplicateEntry,
	restoreEntry,
	permanentlyDeleteEntry,
	bulkUpdateStatus,
	bulkDeleteEntries,
	searchEntries,
	getAllEntries,
} from '@/app/actions';

interface EntryListContextType {
	// State
	slug: string;
	schema: ContentTypeDefinition | null;
	entries: ContentEntry[];
	trashEntries: ContentEntry[];
	tab: 'entries' | 'trash';
	selected: Set<string>;
	searchQuery: string;
	searching: boolean;
	bulkStatus: string;
	refCache: Record<string, ContentEntry>;
	visibleCols: string[];
	colPickerOpen: boolean;

	// Actions
	setSlug: (slug: string) => void;
	setSchema: (schema: ContentTypeDefinition | null) => void;
	setEntries: (entries: ContentEntry[]) => void;
	setTrashEntries: (entries: ContentEntry[]) => void;
	setTab: (tab: 'entries' | 'trash') => void;
	setSearchQuery: (query: string) => void;
	setSearching: (searching: boolean) => void;
	setBulkStatus: (status: string) => void;
	setRefCache: (cache: Record<string, ContentEntry>) => void;
	setVisibleCols: (cols: string[]) => void;
	setColPickerOpen: (open: boolean) => void;

	// Handlers
	handleTabChange: (newTab: 'entries' | 'trash') => void;
	handleSearch: (e: React.FormEvent) => Promise<void>;
	handleClearSearch: (slug: string) => Promise<void>;
	handleDuplicate: (slug:string, id: string) => Promise<void>;
	handleDelete: (slug: string, id: string) => Promise<void>;
	handleRestore: (slug: string, id: string) => Promise<void>;
	handlePermanentDelete: (slug: string, id: string) => Promise<void>;
	handleBulkStatus: (slug: string) => Promise<void>;
	handleBulkDelete: (slug: string) => Promise<void>;
	toggleCol: (key: string, schemaId: string | undefined) => void;
	toggleSelected: (id: string) => void;
	toggleAllSelected: () => void;
	clearSelection: () => void;
}

const EntryListContext = createContext<EntryListContextType | undefined>(undefined);

export function EntryListProvider({ children }: { children: ReactNode }) {
	const [slug, setSlug] = useState<string>('');
	const [schema, setSchema] = useState<ContentTypeDefinition | null>(null);
	const [entries, setEntries] = useState<ContentEntry[]>([]);
	const [trashEntries, setTrashEntries] = useState<ContentEntry[]>([]);
	const [tab, setTab] = useState<'entries' | 'trash'>('entries');
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState('');
	const [searching, setSearching] = useState(false);
	const [bulkStatus, setBulkStatus] = useState('');
	const [refCache, setRefCache] = useState<Record<string, ContentEntry>>({});
	const [visibleCols, setVisibleCols] = useState<string[]>([]);
	const [colPickerOpen, setColPickerOpen] = useState(false);

	const handleTabChange = useCallback((newTab: 'entries' | 'trash') => {
		setTab(newTab);
		setSelected(new Set());
		setSearchQuery('');
	}, []);

	const handleSearch = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!searchQuery.trim()) {
				const result = await getAllEntries(schema?.slug ?? '');
				setEntries(result.data?.items ?? []);
				return;
			}
			setSearching(true);
			const res = await searchEntries(schema?.slug ?? '', searchQuery);
			setSearching(false);
			if (res.error) alert(res.error);
			else setEntries(res.data?.items ?? []);
		},
		[searchQuery, schema?.slug]
	);

	const handleClearSearch = useCallback(
		async (slug: string) => {
			setSearchQuery('');
			const r = await getAllEntries(slug);
			setEntries(r.data?.items ?? []);
		},
		[]
	);

	const handleDuplicate = useCallback(
		async (slug: string, id: string) => {
			const res = await duplicateEntry(slug, id);
			if (res.error) {
				alert(res.error);
				return;
			}
			if (res.data) setEntries(prev => [res.data as ContentEntry, ...prev]);
		},
		[]
	);

	const handleDelete = useCallback((slug: string, id: string) => {
		if (!confirm('Move this entry to trash?')) return Promise.resolve();
		return deleteEntry(slug, id).then(({ error: err }) => {
			if (err) alert(err);
			else {
				setEntries(prev => prev.filter(e => e._id !== id));
				const trash = entries.filter(e => e._id === id);
				setTrashEntries(prev => [...prev, ...trash]);
			}
		});
	}, [entries]);

	const handleRestore = useCallback(async (slug: string, id: string) => {
		const res = await restoreEntry(slug, id);
		if (res.error) alert(res.error);
		else alert('Entry restored!');
	}, []);

	const handlePermanentDelete = useCallback((slug: string, id: string) => {
		if (!confirm('Permanently delete? This cannot be undone.')) return Promise.resolve();
		return permanentlyDeleteEntry(slug, id).then(({ error: err }) => {
			if (err) alert(err);
			else {
				alert('Entry permanently deleted');
				setTrashEntries(prev => prev.filter(e => e._id !== id));
			}
		});
	}, []);

	const handleBulkStatus = useCallback(
		async (slug: string) => {
			if (!bulkStatus || selected.size === 0) return;
			const ids = Array.from(selected);
			try {
				const res = await bulkUpdateStatus(slug, ids, bulkStatus as 'draft' | 'published' | 'scheduled' | 'archived');
				if (res.error) {
					console.error('Bulk update error:', res.error);
					alert('Error updating entries: ' + res.error);
					return;
				}
				alert(`Updated ${ids.length} entries`);
				setSelected(new Set());
				setBulkStatus('');
				setSearchQuery('');
			} catch (err) {
				console.error('Bulk update exception:', err);
				alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
			}
		},
		[bulkStatus, selected]
	);

	const handleBulkDelete = useCallback(
		async (slug: string) => {
			if (selected.size === 0) return;
			if (!confirm(`Delete ${selected.size} entries? They'll be moved to trash.`)) return;
			const ids = Array.from(selected);
			try {
				const res = await bulkDeleteEntries(slug, ids);
				if (res.error) {
					console.error('Bulk delete error:', res.error);
					alert('Error deleting entries: ' + res.error);
					return;
				}
				alert(`Deleted ${ids.length} entries`);
				setEntries(prev => prev.filter(e => !ids.includes(e._id || '')));
				const movedToTrash = entries.filter(e => ids.includes(e._id || ''));
				setTrashEntries(prev => [...prev, ...movedToTrash]);
				setSelected(new Set());
			} catch (err) {
				console.error('Bulk delete exception:', err);
				alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
			}
		},
		[selected, entries]
	);

	const toggleCol = useCallback((key: string, schemaId: string | undefined) => {
		setVisibleCols(prev => {
			const next = prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key];
			if (schemaId && typeof window !== 'undefined') {
				localStorage.setItem(`cms_cols_${schemaId}`, JSON.stringify(next));
			}
			return next;
		});
	}, []);

	const toggleSelected = useCallback((id: string) => {
		setSelected(prev => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	const toggleAllSelected = useCallback(() => {
		const curr = tab === 'entries' ? entries : trashEntries;
		if (selected.size === curr.length) {
			setSelected(new Set());
		} else {
			setSelected(new Set(curr.map(e => e._id).filter(Boolean) as string[]));
		}
	}, [tab, entries, trashEntries, selected.size]);

	const clearSelection = useCallback(() => {
		setSelected(new Set());
	}, []);

	const value = {
		slug,
		schema,
		entries,
		trashEntries,
		tab,
		selected,
		searchQuery,
		searching,
		bulkStatus,
		refCache,
		visibleCols,
		colPickerOpen,

		setSlug,
		setSchema,
		setEntries,
		setTrashEntries,
		setTab,
		setSearchQuery,
		setSearching,
		setBulkStatus,
		setRefCache,
		setVisibleCols,
		setColPickerOpen,

		handleTabChange,
		handleSearch,
		handleClearSearch,
		handleDuplicate,
		handleDelete,
		handleRestore,
		handlePermanentDelete,
		handleBulkStatus,
		handleBulkDelete,
		toggleCol,
		toggleSelected,
		toggleAllSelected,
		clearSelection,
	};

	return (
		<EntryListContext.Provider value={value}>
			{children}
		</EntryListContext.Provider>
	);
}

export function useEntryList() {
	const context = useContext(EntryListContext);
	if (!context) {
		throw new Error('useEntryList must be used within EntryListProvider');
	}
	return context;
}
