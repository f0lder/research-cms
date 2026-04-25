import Link from 'next/link';
import { ContentEntry, FieldDefinition } from '@research-cms/shared-types';
import { CellValue } from './CellValue';
import { Badge } from '@/components/ui';
import { adminRoutes, formatDate } from '@/lib/utils';
import { useEntryList } from '@/contexts/EntryListContext';
import { Button } from '@/components/ui';
import { MdEdit, MdContentCopy  } from 'react-icons/md';
import { FaTrash, FaTimes } from "react-icons/fa";
import { LiaUndoSolid } from "react-icons/lia";


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
		<tr className="border-b border-zinc-100 hover:bg-zinc-50 even:bg-zinc-200 transition-colors">
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
					<Badge status={entry.status} />
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
								<Button variant='primary' size='xs' icon={<MdEdit />} >
									Edit
								</Button>
							</Link>
							<Button
								variant='secondary'
								size='xs'
								icon={<MdContentCopy />}
								onClick={() => handleDuplicate(slug, entry._id || '')}
							>
								Dup
							</Button>
							<Button
								variant='destructive'
								size='xs'
								icon={<FaTrash />}
								onClick={() => handleDelete(slug, entry._id || '')}
							>
								Trash
							</Button>
						</>
					)}
					{tab === 'trash' && (
						<>
							<Button
								variant='secondary'
								size='xs'								
								icon={<LiaUndoSolid />}
								onClick={() => handleRestore(slug, entry._id || '')}
							>
								Restore
							</Button>
							<Button
								variant='destructive'
								size='xs'
								icon={<FaTimes />}
								onClick={() => handlePermanentDelete(slug, entry._id || '')}
							>
								Delete
							</Button>
						</>
					)}
				</div>
      </td>
    </tr>
  );
}
