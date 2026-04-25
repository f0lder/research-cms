import Link from 'next/link';
import { ContentEntry, FieldDefinition } from '@research-cms/shared-types';
import { CellValue } from './CellValue';
import { StatusBadge } from './StatusBadge';
import { adminRoutes, formatDate } from '@/lib/utils';
import { useEntryList } from '@/contexts/EntryListContext';
import { Button, Text } from '@/components/ui';

interface EntryTableRowProps {
	entry: ContentEntry;
	visibleFields: FieldDefinition[];
	showStatus: boolean;
	showDate: boolean;
	selected: boolean;
	onSelectChange: (id: string) => void;
}

export function EntryTableRow({
	entry,
	visibleFields,
	showStatus,
	showDate,
	selected,
	onSelectChange,
}: EntryTableRowProps) {
	const { tab, slug, refCache, handleDuplicate, handleDelete, handleRestore, handlePermanentDelete } = useEntryList();

	return (
		<tr className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
			<td className="px-4 py-3">
				<input
					type="checkbox"
					checked={selected}
					onChange={() => onSelectChange(entry._id || '')}
					className="cursor-pointer"
				/>
			</td>
			{visibleFields.map(field => (
				<td key={field.name} className="px-4 py-3 max-w-xs">
					<CellValue value={entry.data[field.name]} field={field} refCache={refCache} />
				</td>
			))}
			{showStatus && (
				<td className="px-4 py-3">
					<StatusBadge status={entry.status} />
				</td>
			)}
			{showDate && (
				<td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
					{entry.createdAt ? formatDate(entry.createdAt as string) : '—'}
				</td>
			)}
			<td className="px-4 py-3">
				<div className="flex justify-end gap-2">
					{tab === 'entries' && (
						<>
							<Link href={adminRoutes.contentEdit(slug, entry._id ?? '')}>
								<button className="btn-primary text-xs px-3 py-1">Edit</button>
							</Link>
							<button
								onClick={() => handleDuplicate(slug, entry._id || '')}
								className="btn-secondary text-xs px-3 py-1"
							>
								Dup
							</button>
							<button
								onClick={() => handleDelete(slug, entry._id || '')}
								className="btn-danger text-xs px-3 py-1"
							>
								Trash
							</button>
						</>
					)}
					{tab === 'trash' && (
						<>
							<button
								onClick={() => handleRestore(slug, entry._id || '')}
								className="btn-secondary text-xs px-3 py-1"
							>
								Restore
							</button>
							<button
								onClick={() => handlePermanentDelete(slug, entry._id || '')}
								className="btn-danger text-xs px-3 py-1"
							>
								Delete
							</button>
						</>
					)}
				</div>
      </td>
    </tr>
  );
}
