'use client';

import { User } from '@research-cms/shared-types';

interface UsersListProps {
  users: User[];
}

export default function UsersList({ users }: UsersListProps) {
  if (users.length === 0) {
    return (
      <div className="panel text-center py-8">
        <p className="text-xs text-zinc-400">No users</p>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    };
  };

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <div key={user._id} className="panel">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-zinc-900 truncate">{user.name}</div>
              <div className="text-xs text-zinc-400 truncate">{user.email}</div>
              <div className="mt-1">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
