'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ContentTypeDefinition, Client, User, ActivityItem } from '@research-cms/shared-types';
import { api } from '@/lib/utils';
import { ActivityFeed } from '@/components/ActivityFeed';
import SchemasList from '@/components/dashboard/SchemasList';
import UsersList from '@/components/dashboard/UsersList';
import ClientsList from '@/components/dashboard/ClientsList';

interface ContentEntryResponse {
  entries: Record<string, unknown>[];
  total: number;
  pages: number;
}

export default function SystemOverview() {
  const [schemas, setSchemas] = useState<(ContentTypeDefinition & { entryCount?: number })[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch schemas
        const schemasRes = await api.get<ContentTypeDefinition[]>('/schemas');
        if (schemasRes.error) {
          setError('Failed to load schemas');
          return;
        }

        const schemaList = schemasRes.data || [];
        
        // Fetch entry counts for each schema
        const schemasWithCounts = await Promise.all(
          schemaList
            .filter((s: ContentTypeDefinition) => !s.system) // Exclude system schemas
            .map(async (schema: ContentTypeDefinition) => {
              const entriesRes = await api.get<ContentEntryResponse>(
                `/content/${schema.slug}?limit=1`
              );
              return {
                ...schema,
                entryCount: entriesRes.data?.total || 0,
              };
            })
        );

        setSchemas(schemasWithCounts);

        // Fetch users
        const usersRes = await api.get<User[]>('/auth/users');
        if (!usersRes.error) {
          setUsers(usersRes.data || []);
        }

        // Fetch clients
        const clientsRes = await api.get<Client[]>('/clients');
        if (!clientsRes.error) {
          setClients(clientsRes.data || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="page text-sm text-zinc-400">Loading dashboard…</div>;
  }

  if (error) {
    return <div className="page"><div className="alert-error">{error}</div></div>;
  }

  return (
    <div className="page">
      <div className="mb-8">
        <h1 className="page-heading">System Overview</h1>
        <p className="page-sub">Quick view of your CMS state</p>
      </div>

      {/* Grid of summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="panel">
          <div className="text-xs text-zinc-400 mb-2">Content Types</div>
          <div className="text-2xl font-bold text-zinc-900">{schemas.length}</div>
        </div>
        <div className="panel">
          <div className="text-xs text-zinc-400 mb-2">Total Entries</div>
          <div className="text-2xl font-bold text-zinc-900">
            {schemas.reduce((sum, s) => sum + (s.entryCount || 0), 0)}
          </div>
        </div>
        <div className="panel">
          <div className="text-xs text-zinc-400 mb-2">Users</div>
          <div className="text-2xl font-bold text-zinc-900">{users.length}</div>
        </div>
        <div className="panel">
          <div className="text-xs text-zinc-400 mb-2">API Keys</div>
          <div className="text-2xl font-bold text-zinc-900">{clients.length}</div>
        </div>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Schemas and Activity */}
        <div className="lg:col-span-2 space-y-8">
          {/* Post Types */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900">Content Types</h2>
              <Link href="/schemas">
                <button className="text-xs text-zinc-500 hover:text-zinc-900">View all →</button>
              </Link>
            </div>
            <SchemasList schemas={schemas.slice(0, 5)} />
          </div>

          {/* Activity Feed */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Recent Activity</h2>
            <div className="panel">
              <ActivityFeed />
            </div>
          </div>
        </div>

        {/* Right column: Users and Clients */}
        <div className="space-y-8">
          {/* Users */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900">Users</h2>
              <Link href="/users">
                <button className="text-xs text-zinc-500 hover:text-zinc-900">View all →</button>
              </Link>
            </div>
            <UsersList users={users.slice(0, 5)} />
          </div>

          {/* API Keys */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900">API Keys</h2>
              <Link href="/clients">
                <button className="text-xs text-zinc-500 hover:text-zinc-900">View all →</button>
              </Link>
            </div>
            <ClientsList clients={clients.slice(0, 5)} />
          </div>
        </div>
      </div>
    </div>
  );
}
