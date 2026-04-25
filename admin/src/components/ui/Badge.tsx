const STATUS_MAP: Record<string, string> = {
  published: 'badge-published',
  scheduled: 'badge-scheduled',
  archived: 'badge-archived',
  draft: 'badge-draft',
  error: 'badge-error',
  success: 'badge-success',
  client: 'badge-client',
  create: 'badge-published',
  update: 'badge-scheduled',
  delete: 'badge-archived',
  auth: 'badge-auth',
  login: 'badge-auth',
  logout: 'badge-auth',
  restore: 'badge-restore',
  content: 'badge-published',
};

const SIZE_MAP: Record<string, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
};

export function Badge({ status = 'draft', size = 'sm' }: { status?: string; size?: string }) {
  return (
    <span className={STATUS_MAP[status] || 'badge-draft' + ' ' + SIZE_MAP[size] || SIZE_MAP['sm']}>
      {status}
    </span>
  );
}