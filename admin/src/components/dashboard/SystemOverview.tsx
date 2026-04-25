'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ContentTypeDefinition, Client, User, ActivityItem } from '@research-cms/shared-types';
import { api } from '@/lib/utils';
import { ActivityFeed } from '@/components/ActivityFeed';
import { Button, Heading, Text, Card } from '@/components/ui';
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
    return <div className="page"><Text variant="caption" color="secondary">Loading dashboard…</Text></div>;
  }

  if (error) {
    return <div className="page"><div className="alert-error">{error}</div></div>;
  }

  return (
    <div className="page">
      <div className="mb-8">
        <Heading level={1} className="mb-1">System Overview</Heading>
        <Text variant="caption" color="secondary">Quick view of your CMS state</Text>
      </div>

      {/* Grid of summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card variant="filled">
          <Text variant="label" color="secondary" className="mb-2">Content Types</Text>
          <Heading level={3}>{schemas.length}</Heading>
        </Card>
        <Card variant="filled">
          <Text variant="label" color="secondary" className="mb-2">Total Entries</Text>
          <Heading level={3}>{schemas.reduce((sum, s) => sum + (s.entryCount || 0), 0)}</Heading>
        </Card>
        <Card variant="filled">
          <Text variant="label" color="secondary" className="mb-2">Users</Text>
          <Heading level={3}>{users.length}</Heading>
        </Card>
        <Card variant="filled">
          <Text variant="label" color="secondary" className="mb-2">API Keys</Text>
          <Heading level={3}>{clients.length}</Heading>
        </Card>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Schemas and Activity */}
        <div className="lg:col-span-2 space-y-8">
          {/* Post Types */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Heading level={2}>Content Types</Heading>
              <Link href="/schemas">
                <Button as="span" variant="ghost" size="sm" className="text-primary">
                  View all →
                </Button>
              </Link>
            </div>
            <SchemasList schemas={schemas.slice(0, 5)} />
          </div>

          {/* Activity Feed */}
          <div>
            <Heading level={2} className="mb-4">Recent Activity</Heading>
            <Card variant="outlined">
              <ActivityFeed />
            </Card>
          </div>
        </div>

        {/* Right column: Users and Clients */}
        <div className="space-y-8">
          {/* Users */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Heading level={2}>Users</Heading>
              <Link href="/users">
                <Button as="span" variant="ghost" size="sm" className="text-primary">
                  View all →
                </Button>
              </Link>
            </div>
            <UsersList users={users.slice(0, 5)} />
          </div>

          {/* API Keys */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Heading level={2}>API Keys</Heading>
              <Link href="/clients">
                <Button as="span" variant="ghost" size="sm" className="text-primary">
                  View all →
                </Button>
              </Link>
            </div>
            <ClientsList clients={clients.slice(0, 5)} />
          </div>
        </div>
      </div>
    </div>
  );
}
