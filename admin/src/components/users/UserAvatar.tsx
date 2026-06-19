'use client';

import { User } from '@research-cms/shared-types';

/** Best display name for a user: explicit displayName → name → email local part. */
export function userDisplayName(user: Pick<User, 'displayName' | 'name' | 'email'>): string {
  return user.displayName?.trim() || user.name?.trim() || user.email.split('@')[0] || 'User';
}

function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZES: Record<string, string> = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-16 h-16 text-base',
};

export function UserAvatar({
  user,
  size = 'md',
}: {
  user: Pick<User, 'displayName' | 'name' | 'email' | 'avatarUrl'>;
  size?: 'sm' | 'md' | 'lg';
}) {
  const label = userDisplayName(user);
  const sizeCls = SIZES[size] ?? SIZES.md;

  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={user.avatarUrl}
        alt={label}
        className={`${sizeCls} object-cover border-2 border-on-surface shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeCls} flex items-center justify-center border-2 border-on-surface bg-surface-container font-mono font-bold uppercase text-on-surface shrink-0`}
    >
      {initials(label)}
    </div>
  );
}
