import { ContentTypeDefinition, FieldDefinition } from '@research-cms/shared-types';

interface EntryTableHeadProps {
  visibleFields: FieldDefinition[];
  showStatus: boolean;
  showDate: boolean;
  allSelected: boolean;
  onSelectAll: () => void;
}

export function EntryTableHead({
  visibleFields,
  showStatus,
  showDate,
  allSelected,
  onSelectAll,
}: EntryTableHeadProps) {
  return (
    <thead>
      <tr className="border-b border-zinc-100 bg-zinc-50">
        <th className="px-4 py-2.5 text-left">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onSelectAll}
            className="cursor-pointer"
          />
        </th>
        {visibleFields.map(field => (
          <th
            key={field.name}
            className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap"
          >
            {field.label}
          </th>
        ))}
        {showStatus && (
          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
            Status
          </th>
        )}
        {showDate && (
          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
            Date
          </th>
        )}
        <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
  );
}
