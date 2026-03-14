'use client';
import { useState, useEffect } from 'react';
import { api, formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface UserEntry {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
}

const ROLES = ['admin', 'editor', 'viewer'];

const roleBg: Record<string, string> = {
  admin: 'bg-zinc-900',
  editor: 'bg-zinc-600',
  viewer: 'bg-zinc-400',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    api.get<UserEntry[]>('/auth/users').then(({ data, error: err }) => {
      if (data) setUsers(data);
      if (err) setError(err);
      setLoading(false);
    });
  }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    setUpdating(userId);
    const { data, error: err } = await api.patch<UserEntry>(`/auth/users/${userId}`, { role });
    if (data) setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: data.role } : u));
    if (err) alert(err);
    setUpdating(null);
  };

  if (loading) return <div className="p-8 font-mono text-sm text-zinc-400">Loading…</div>;

  return (
    <div className="page">
      <div className="mb-8">
        <h1 className="page-heading">Users</h1>
        <p className="page-sub">{users.length} user{users.length !== 1 ? 's' : ''}</p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="flex flex-col gap-2">
        {users.map(u => (
          <div key={u._id} className="panel flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-900 mb-0.5">{u.name}</p>
              <p className="text-xs text-zinc-500 mb-0.5">{u.email}</p>
              {u.createdAt && (
                <p className="text-xs text-zinc-300">Joined {formatDate(u.createdAt)}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {currentUser?.role === 'admin' && u._id !== currentUser?.id ? (
                <select
                  value={u.role}
                  disabled={updating === u._id}
                  onChange={e => handleRoleChange(u._id, e.target.value)}
                  className="field-input w-auto py-1.5 cursor-pointer"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <span className={`${roleBg[u.role] ?? 'bg-zinc-500'} text-white text-[10px] uppercase tracking-widest px-2.5 py-1 font-mono`}>
                  {u.role}
                </span>
              )}
              <span
                title={u.isActive ? 'Active' : 'Inactive'}
                className={`w-2 h-2 rounded-full shrink-0 ${u.isActive ? 'bg-green-500' : 'bg-red-400'}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
