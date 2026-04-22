'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Client } from '@research-cms/shared-types';
import { api } from '@/lib/utils';

interface UsageData {
  date: string;
  userCount: number;
  users: string[];
  schemas: Record<string, number>;
}

interface ClientsListProps {
  clients: Client[];
}

function ClientCard({ client }: { client: Client }) {
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);

  useEffect(() => {
    const fetchUsage = async () => {
      setLoadingUsage(true);
      const res = await api.get<UsageData[]>(`/clients/${client._id}/usage?days=7`);
      if (!res.error && res.data) {
        setUsage(res.data);
      }
      setLoadingUsage(false);
    };

    fetchUsage();
  }, [client._id]);

  // Calculate totals for the last 7 days
  const totalRequests = usage.reduce((sum, day) => {
    return sum + Object.values(day.schemas).reduce((a, b) => a + b, 0);
  }, 0);

  const uniqueUsers = new Set(usage.flatMap(day => day.users)).size;

  return (
    <Link href={`/clients/${client._id}`} className="no-underline">
      <div className="panel hover:bg-zinc-50 cursor-pointer transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-zinc-900 truncate">{client.name}</h3>
            <div className="text-xs text-zinc-400 truncate font-mono">{client.key.slice(0, 16)}…</div>
            <div className="flex gap-3 mt-2 text-xs">
              <span className="text-zinc-500">
                {loadingUsage ? '…' : totalRequests} requests
              </span>
              <span className="text-zinc-500">
                {loadingUsage ? '…' : uniqueUsers} users
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ClientsList({ clients }: ClientsListProps) {
  if (clients.length === 0) {
    return (
      <div className="panel text-center py-8">
        <p className="text-xs text-zinc-400">No API keys yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clients.map((client) => (
        <ClientCard key={client._id} client={client} />
      ))}
    </div>
  );
}
