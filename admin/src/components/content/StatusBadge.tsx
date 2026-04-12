interface StatusBadgeProps {
  status?: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors: Record<string, { bg: string; text: string }> = {
    draft: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
    published: { bg: 'bg-green-50', text: 'text-green-700' },
    scheduled: { bg: 'bg-blue-50', text: 'text-blue-700' },
    archived: { bg: 'bg-gray-50', text: 'text-gray-700' },
  };
  const style = colors[status ?? 'draft'] ?? colors['draft'];
  return (
    <span className={`text-xs px-2 py-1 rounded ${style.bg} ${style.text} font-mono font-semibold`}>
      {status ?? 'draft'}
    </span>
  );
}
