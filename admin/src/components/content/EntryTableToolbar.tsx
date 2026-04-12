import { ContentTypeDefinition } from '@research-cms/shared-types';
import { ColumnPicker } from './ColumnPicker';
import { useEntryList } from '@/contexts/EntryListContext';

interface TableToolbarProps {
	entriesCount: number;
	selectedCount: number;
	tab: 'entries' | 'trash';
	schema: ContentTypeDefinition;
}

export function EntryTableToolbar({
	entriesCount,
	selectedCount,
	tab,
	schema,
}: TableToolbarProps) {
	const {
		slug,
		bulkStatus,
		setBulkStatus,
		colPickerOpen,
		setColPickerOpen,
		visibleCols,
		toggleCol,
		clearSelection,
		handleBulkStatus,
	} = useEntryList();

	return (
		<div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 gap-3 flex-wrap">
			<span className="text-xs text-zinc-400">
				{entriesCount} {entriesCount === 1 ? 'entry' : 'entries'}
				{selectedCount > 0 && ` · ${selectedCount} selected`}
			</span>

			{/* Bulk actions */}
			{selectedCount > 0 && tab === 'entries' && (
				<div className="flex gap-2 items-center">
					<select
						value={bulkStatus}
						onChange={e => setBulkStatus(e.target.value)}
						className="field-input text-xs py-1"
					>
						<option value="">Set status to…</option>
						<option value="draft">Draft</option>
						<option value="published">Published</option>
						<option value="scheduled">Scheduled</option>
						<option value="archived">Archived</option>
					</select>
					<button
						onClick={() => handleBulkStatus(slug)}
						disabled={!bulkStatus}
						className="btn-secondary text-xs px-3 py-1"
					>
						Apply
					</button>
					<button
						onClick={clearSelection}
						className="btn-ghost text-xs px-3 py-1"
					>
						Cancel
					</button>
				</div>
			)}

			{/* Column picker */}
			<ColumnPicker
				open={colPickerOpen}
				onOpenChange={setColPickerOpen}
				visibleCols={visibleCols}
				onToggleCol={(col) => toggleCol(col, schema._id)}
				schema={schema}
			/>
		</div>
	);
}

