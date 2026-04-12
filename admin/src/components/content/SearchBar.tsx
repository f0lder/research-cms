interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  searching: boolean;
  onClear: () => void;
}

export function SearchBar({ query, onQueryChange, onSubmit, searching, onClear }: SearchBarProps) {
  return (
    <form onSubmit={onSubmit} className="mb-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="Search entries…"
          className="flex-1 field-input"
        />
        <button type="submit" disabled={searching} className="btn-secondary px-4">
          {searching ? 'Searching…' : 'Search'}
        </button>
        {query && (
          <button
            type="button"
            onClick={onClear}
            className="btn-ghost px-4"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
