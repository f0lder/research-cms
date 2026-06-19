'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Client } from '@research-cms/shared-types';
import { formatDateTime, extractParam, adminRoutes } from '@/lib/utils';
import { getClient } from '@/app/actions';
import { ApiKeyUsageChart } from '@/components/clients/ApiKeyUsageChart';
import { Breadcrumb } from '@/components/ui';
import { LuKey, LuChartColumn } from 'react-icons/lu';

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
          <div className="h-8 bg-surface-container rounded animate-pulse" />
          <div className="h-4 bg-surface-container-low rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !client) return <div className="page"><div className="alert-error">{error}</div></div>;
  if (!client) return null;

  return (
    <div className="page">
      <Breadcrumb
        items={[
          { label: 'Clients', href: adminRoutes.clients, icon: LuKey },
          { label: client.name, href: adminRoutes.clientDetail(id) },
          { label: 'Usage', icon: LuChartColumn },
        ]}
      />

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6 mb-6">
        <div className="min-w-0">
          <h1 className="page-heading">Usage Analytics</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-code text-on-surface-variant">
              <span className="text-on-surface font-bold">{client.hits.toLocaleString()}</span> hits
            </span>
            {client.lastUsedAt && <span className="text-code text-on-surface-variant hidden sm:inline">· last used {formatDateTime(client.lastUsedAt)}</span>}
          </div>
        </div>
        <Link href={adminRoutes.clientDetail(id)} className="btn-primary text-code px-3 py-2 no-underline text-center whitespace-nowrap shrink-0 uppercase">
          Back to Configuration
        </Link>
      </div>

      {/* ── Usage Chart ─────────────────────────────── */}
      {client._id && <ApiKeyUsageChart clientId={client._id} />}
    </div>
  );
}
