'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User } from '@research-cms/shared-types';
import { adminRoutes, formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getUsers } from '@/app/actions';
import { ListSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui';
import { UserAvatar, userDisplayName } from '@/components/users/UserAvatar';
import { MdEdit } from 'react-icons/md';

const roleBg: Record<string, string> = {
  admin: 'bg-zinc-900',
  editor: 'bg-zinc-600',
  viewer: 'bg-zinc-400',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error: err } = await getUsers();
      if (data) setUsers(data as User[]);
      if (err) setError(err);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="mb-8 space-y-2 w-1/2">
          <div className="h-8 bg-zinc-200 rounded animate-pulse" />
          <div className="h-4 bg-zinc-100 rounded animate-pulse" />
        </div>
        <ListSkeleton items={8} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="mb-8">
        <h1 className="page-heading">Users</h1>
        <p className="page-sub">{users.length} user{users.length !== 1 ? 's' : ''}</p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {users.length === 0 ? (
        <div className="panel text-center py-8">
          <p className="text-xs text-zinc-400">No users</p>
        </div>
      ) : (
        <div className="border-2 border-on-surface bg-white shadow-hard overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-on-surface bg-surface-container">
                <th className="text-left px-4 py-2.5 text-code font-bold text-on-surface-variant uppercase whitespace-nowrap">User</th>
                <th className="text-left px-4 py-2.5 text-code font-bold text-on-surface-variant uppercase whitespace-nowrap">Role</th>
                <th className="text-left px-4 py-2.5 text-code font-bold text-on-surface-variant uppercase whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-2.5 text-code font-bold text-on-surface-variant uppercase whitespace-nowrap">Joined</th>
                <th className="px-4 py-2.5 text-right text-code font-bold text-on-surface-variant uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isSelf = u._id === currentUser?.id;
                return (
                  <tr key={u._id} className="border-b border-zinc-100 hover:bg-zinc-50 even:bg-zinc-100/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={u} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 truncate">
                            {userDisplayName(u)}
                            {isSelf && <span className="ml-2 text-[10px] text-zinc-400 font-mono uppercase">(you)</span>}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`${roleBg[u.role] ?? 'bg-zinc-500'} text-white text-[10px] uppercase tracking-widest px-2.5 py-1 font-mono`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${u.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                      {u.createdAt ? formatDate(u.createdAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {currentUser?.role === 'admin' ? (
                          <Link href={adminRoutes.userEdit(u._id || '')}>
                            <Button variant="primary" size="xs" icon={<MdEdit />}>Edit</Button>
                          </Link>
                        ) : (
                          <span className="text-xs text-zinc-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
