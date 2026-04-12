import { ContentEntry, FieldDefinition } from '@research-cms/shared-types';
import { EntryTableHead } from './EntryTableHead';
import { EntryTableRow } from './EntryTableRow';
import { useEntryList } from '@/contexts/EntryListContext';

interface EntryTableProps {
	entries: ContentEntry[];
	visibleFields: FieldDefinition[];
	showStatus: boolean;
	showDate: boolean;
}

export function EntryTable({
	entries,
	visibleFields,
	showStatus,
	showDate,
}: EntryTableProps) {
	const { selected, tab, toggleSelected, toggleAllSelected } = useEntryList();

	const allSelected = selected.size > 0 && selected.size === entries.length;

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm border-collapse">
				<EntryTableHead
					visibleFields={visibleFields}
					showStatus={showStatus}
					showDate={showDate}
					allSelected={allSelected}
					onSelectAll={toggleAllSelected}
				/>
				<tbody>
					{entries.map(entry => (
						<EntryTableRow
							key={entry._id}
							entry={entry}
							visibleFields={visibleFields}
							showStatus={showStatus}
							showDate={showDate}
							selected={selected.has(entry._id || '')}
							onSelectChange={toggleSelected}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
}
