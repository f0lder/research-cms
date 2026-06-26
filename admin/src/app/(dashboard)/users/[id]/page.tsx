'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { User, UserRole } from '@research-cms/shared-types';
import { extractParam, adminRoutes } from '@/lib/utils';
import { getUser, updateUser } from '@/app/actions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Toggle, SelectField, Breadcrumb } from '@/components/ui';
import { LuUsers } from 'react-icons/lu';
import { UserAvatar, userDisplayName } from '@/components/users/UserAvatar';

const ROLES: UserRole[] = [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER];

const ROLE_HINT: Partial<Record<UserRole, string>> = {
  [UserRole.ADMIN]: 'Full access — manage schemas, content, users and settings.',
  [UserRole.EDITOR]: 'Create and edit content.',
  [UserRole.VIEWER]: 'Read-only access.',
};

export default function UserEditPage() {
  const params = useParams();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const id = extractParam(params as Record<string, string | string[]>, 'id');
  const isSelf = id === currentUser?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.EDITOR);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!id) return;
    getUser(id).then(({ data, error: err }) => {
      if (err || !data) { setError(err ?? 'Not found'); setLoading(false); return; }
      setEmail(data.email);
      setName(data.name ?? '');
      setFirstName(data.firstName ?? '');
      setLastName(data.lastName ?? '');
      setDisplayName(data.displayName ?? '');
      setBio(data.bio ?? '');
      setWebsite(data.website ?? '');
      setAvatarUrl(data.avatarUrl ?? '');
      setRole((data.role as UserRole) ?? UserRole.EDITOR);
      setIsActive(data.isActive ?? true);
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Name is required', 'error');
      setError('Name is required.');
      return;
    }
    if (website.trim()) {
      try { new URL(website.trim()); } catch {
        showToast('Website must be a valid URL', 'error');
        setError('Website must be a valid URL.');
        return;
      }
    }

    setSaving(true);
    setError('');

    const { error: err } = await updateUser(id, {
      name: name.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: displayName.trim(),
      bio: bio.trim(),
      website: website.trim(),
      avatarUrl: avatarUrl.trim(),
      // Don't let an admin lock themselves out of admin / deactivate their own account.
      ...(isSelf ? {} : { role, isActive }),
    });

    setSaving(false);
    if (err) {
      showToast(err, 'error');
      setError(err);
      return;
    }
    showToast('User updated successfully', 'success');
  };

  if (loading) return <div className="page text-sm text-zinc-400">Loading…</div>;

  const preview: Pick<User, 'displayName' | 'name' | 'email' | 'avatarUrl'> = {
    displayName, name, email, avatarUrl,
  };

  return (
    <div className="page max-w-3xl">
      <Breadcrumb
        items={[
          { label: 'Users', href: adminRoutes.users, icon: LuUsers },
          { label: userDisplayName(preview) },
        ]}
      />
      <h1 className="text-lg font-bold font-mono mb-6">{userDisplayName(preview)}</h1>

      {error && <div className="alert-error mb-4 text-xs">{error}</div>}

      {/* Identity header */}
      <div className="flex items-center gap-4 mb-8 panel">
        <UserAvatar user={preview} size="lg" />
        <div className="min-w-0">
          <p className="text-base font-bold text-zinc-900 truncate">{userDisplayName(preview)}</p>
          <p className="text-xs text-zinc-500 truncate">{email}</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Name</label>
          <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
        </div>

        {/* First / Last name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">First name</label>
            <input className="field-input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Last name</label>
            <input className="field-input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" />
          </div>
        </div>

        {/* Display name */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Display name <span className="font-normal normal-case text-zinc-400">(shown publicly — defaults to name)</span>
          </label>
          <input className="field-input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Jane D." />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Email <span className="font-normal normal-case text-zinc-400">(read-only)</span>
          </label>
          <input className="field-input font-mono" value={email} disabled />
        </div>

        {/* Website */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Website</label>
          <input className="field-input font-mono" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" />
        </div>

        {/* Avatar URL */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Avatar URL</label>
          <input className="field-input font-mono" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.jpg" />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Biographical info</label>
          <textarea
            className="field-input min-h-24 resize-y"
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="A short bio…"
          />
        </div>

        {/* Role */}
        <div className="w-64">
          <SelectField
            label="Role"
            value={role}
            disabled={isSelf}
            onChange={v => setRole(v as UserRole)}
            options={ROLES}
            hint={isSelf ? "You can't change your own role." : ROLE_HINT[role]}
          />
        </div>

        {/* Active */}
        <div>
          <Toggle
            checked={isActive}
            onChange={setIsActive}
            label="Active"
            disabled={isSelf}
          />
          {isSelf && <p className="field-hint normal-case tracking-normal">You can&apos;t deactivate your own account.</p>}
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-4 py-2">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
