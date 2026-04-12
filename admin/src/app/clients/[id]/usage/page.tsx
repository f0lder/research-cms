'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Client } from '@research-cms/shared-types';
import { formatDateTime, extractParam, adminRoutes } from '@/lib/utils';
import { getClient } from '@/app/actions';
import { ApiKeyUsageChart } from '@/components/clients/ApiKeyUsageChart';

export default function ClientUsagePage() {
  const params = useParams();
  const id = extractParam(params, 'id');
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      const clientRes = await getClient(id);
      if (clientRes.error) {
        setError(clientRes.error);
      } else {
        setClient(clientRes.data ?? null);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <div className="space-y-2 w-1/2">
          <div className="h-8 bg-zinc-200 rounded animate-pulse" />
          <div className="h-4 bg-zinc-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !client) return <div className="page"><div className="alert-error">{error}</div></div>;
  if (!client) return null;

  return (
    <div className="page">
      <p className="breadcrumb mb-6">
        <Link href={adminRoutes.clients}>Clients</Link>
        <span className="mx-1">/</span>
        <Link href={adminRoutes.clientDetail(id)}>{client.name}</Link>
        <span className="mx-1">/</span>
        Usage
      </p>

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6 mb-6">
        <div className="min-w-0">
          <h1 className="page-heading">Usage Analytics</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-zinc-400">
              <span className="text-zinc-600 font-semibold">{client.hits.toLocaleString()}</span> hits
            </span>
            {client.lastUsedAt && <span className="text-xs text-zinc-400 hidden sm:inline">· last used {formatDateTime(client.lastUsedAt)}</span>}
          </div>
        </div>
        <Link href={adminRoutes.clientDetail(id)} className="btn-primary text-xs px-3 py-1.5 no-underline text-center whitespace-nowrap shrink-0">
          Back to Configuration
        </Link>
      </div>

      {/* ── Usage Chart ─────────────────────────────── */}
      {client._id && <ApiKeyUsageChart clientId={client._id} />}
    </div>
  );
}
