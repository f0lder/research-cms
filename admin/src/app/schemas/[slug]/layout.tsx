import { EntryListProvider } from '@/contexts/EntryListContext';

export default function SchemaDetailLayout({ children }: { children: React.ReactNode }) {
	return (
		<EntryListProvider>
			{children}
		</EntryListProvider>
	);
}
