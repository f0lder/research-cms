'use client';
import { useEffect, useState } from 'react';
import { getClientUsage, clearClientUsage } from '@/app/actions';

interface UsageData {
  date: string;
  userCount: number;
  users: string[];
  schemas: Record<string, number>;
}

interface ApiKeyUsageChartProps {
  clientId: string;
  onCleared?: () => void;
}

export function ApiKeyUsageChart({ clientId, onCleared }: ApiKeyUsageChartProps) {
  const [data, setData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [uniqueUsers, setUniqueUsers] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      const { data: usageData, error: err } = await getClientUsage(clientId, days);
      if (err) {
        setError(err);
      } else {
        const sorted = (usageData ?? []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setData(sorted);
        
        // Build unique users map with activity count
        const userMap = new Map<string, number>();
        sorted.forEach(d => {
          if (d.users) {
            d.users.forEach(user => {
              userMap.set(user, (userMap.get(user) || 0) + 1);
            });
          }
        });
        setUniqueUsers(userMap);
        setSelectedUser(null);
      }
      setLoading(false);
    })();
  }, [clientId, days]);

  const handleClear = async () => {
    setClearing(true);
    try {
      const { error: err } = await clearClientUsage(clientId);
      if (err) {
        setError(err);
      } else {
        setData([]);
        setUniqueUsers(new Map());
        setSelectedUser(null);
        setShowClearConfirm(false);
        onCleared?.();
      }
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-zinc-200 rounded p-6">
        <div className="h-6 bg-zinc-200 rounded w-32 animate-pulse mb-4" />
        <div className="h-64 bg-zinc-100 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-zinc-200 rounded p-6">
        <h3 className="text-lg font-semibold mb-2">Usage Analytics</h3>
        <div className="alert-error text-sm">{error}</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded p-6">
        <h3 className="text-lg font-semibold mb-2">Usage Analytics</h3>
        <p className="text-zinc-500 text-sm">No usage data yet.</p>
      </div>
    );
  }

  // Calculate stats
  const allSchemas = new Set<string>();
  data.forEach(d => {
    Object.keys(d.schemas).forEach(s => allSchemas.add(s));
  });

  // Filter data by selected user if chosen
  const filteredData = selectedUser
    ? data.filter(d => d.users?.includes(selectedUser))
    : data;

  // Get schema breakdown (latest or per-selected user)
  let schemaBreakdown: Record<string, number> = {};
  if (selectedUser) {
    // Build schema breakdown for selected user
    filteredData.forEach(d => {
      Object.entries(d.schemas).forEach(([schema, count]) => {
        schemaBreakdown[schema] = (schemaBreakdown[schema] || 0) + count;
      });
    });
  } else {
    // Use latest day
    if (data.length > 0) {
      schemaBreakdown = data[data.length - 1].schemas ?? {};
    }
  }

  const schemaBreakdownList = Object.entries(schemaBreakdown)
    .sort(([, a], [, b]) => b - a);
  const maxSchemaUsers = Math.max(...schemaBreakdownList.map(([, users]) => users), 1);

  // Sort users by activity (descending)
  const usersList = Array.from(uniqueUsers.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20);

  return (
    <div className="bg-white border border-zinc-200 rounded p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6 mb-6">
        <h3 className="text-lg font-semibold">Usage Analytics</h3>
        <div className="flex flex-wrap gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 text-sm rounded whitespace-nowrap ${
                days === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-1 text-sm rounded bg-red-50 text-red-700 hover:bg-red-100 whitespace-nowrap"
          >
            Clear Data
          </button>
        </div>
      </div>

      {showClearConfirm && (
        <div className="mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-900 mb-3">
            Are you sure? This will permanently delete all usage data for this API key.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleClear}
              disabled={clearing}
              className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 whitespace-nowrap order-2 sm:order-1"
            >
              {clearing ? 'Clearing...' : 'Delete All Data'}
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              disabled={clearing}
              className="px-3 py-1 text-sm rounded bg-zinc-200 text-zinc-700 hover:bg-zinc-300 disabled:opacity-50 whitespace-nowrap order-1 sm:order-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="border-l-4 border-blue-600 pl-3 md:pl-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wide">
            {selectedUser ? 'User Activity Days' : 'Unique Users'}
          </div>
          <div className="text-2xl md:text-3xl font-bold text-zinc-900">
            {selectedUser
              ? (filteredData.length).toLocaleString()
              : (data.reduce((max, d) => Math.max(max, d.userCount), 0)).toLocaleString()}
          </div>
        </div>
        <div className="border-l-4 border-green-600 pl-3 md:pl-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wide">
            {selectedUser ? 'Schemas Used' : 'Avg Users/Day'}
          </div>
          <div className="text-2xl md:text-3xl font-bold text-zinc-900">
            {selectedUser
              ? schemaBreakdownList.length
              : Math.round(data.reduce((sum, d) => sum + d.userCount, 0) / data.length).toLocaleString()}
          </div>
        </div>
        <div className="border-l-4 border-purple-600 pl-3 md:pl-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wide">Total Schemas</div>
          <div className="text-2xl md:text-3xl font-bold text-zinc-900">{allSchemas.size}</div>
        </div>
      </div>

      {/* User list and timeline section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {/* User list */}
        <div className="md:col-span-1 lg:col-span-1 order-2 md:order-1">
          <h4 className="text-sm font-semibold text-zinc-700 mb-3">Unique Users ({uniqueUsers.size})</h4>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {usersList.map(([user, days]) => (
              <button
                key={user}
                onClick={() => setSelectedUser(selectedUser === user ? null : user)}
                className={`w-full text-left px-3 py-2 rounded text-xs font-mono transition ${
                  selectedUser === user
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <div className="truncate">{user}</div>
                <div className="text-xs opacity-75">{days}d active</div>
              </button>
            ))}
            {uniqueUsers.size > 20 && (
              <p className="text-xs text-zinc-500 text-center py-2">+{uniqueUsers.size - 20} more</p>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="md:col-span-1 lg:col-span-3 order-1 md:order-2">
          <h4 className="text-sm font-semibold text-zinc-700 mb-3">
            {selectedUser ? `Activity Timeline - ${selectedUser}` : 'Unique Users by Day'}
          </h4>
          <div className="flex items-end gap-0.5 md:gap-1 h-24 md:h-32">
            {filteredData.map(d => {
              const maxUserCount = Math.max(...filteredData.map(x => selectedUser ? 1 : x.userCount), 1);
              const heightPercent = selectedUser ? 100 : (d.userCount / maxUserCount) * 100;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t hover:opacity-80 transition ${
                      selectedUser ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ height: `${heightPercent}%`, minHeight: '2px' }}
                    title={selectedUser ? `${d.date}` : `${d.date}: ${d.userCount} unique users`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-zinc-500 mt-2">
            <span>{filteredData[0]?.date}</span>
            <span>{filteredData[filteredData.length - 1]?.date}</span>
          </div>
        </div>
      </div>

      {/* Per-schema breakdown */}
      {schemaBreakdownList.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-zinc-700 mb-3">
            {selectedUser ? `Schemas Used by ${selectedUser}` : `Top Schemas by Unique Users`}
          </h4>
          <div className="space-y-2 overflow-x-auto">
            {schemaBreakdownList.slice(0, 10).map(([schema, users]) => (
              <div key={schema} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                <div className="w-full md:w-24 text-sm truncate text-zinc-700 font-mono flex-shrink-0">
                  {schema || 'unknown'}
                </div>
                <div className="flex-1 bg-zinc-100 rounded overflow-hidden h-5">
                  <div
                    className="bg-purple-500 h-5 rounded transition-all"
                    style={{ width: `${(users / maxSchemaUsers) * 100}%` }}
                  />
                </div>
                <div className="w-full md:w-12 text-right text-sm font-mono text-zinc-700 flex-shrink-0">
                  {users}
                </div>
              </div>
            ))}
            {schemaBreakdownList.length > 10 && (
              <p className="text-xs text-zinc-500 pt-2">
                +{schemaBreakdownList.length - 10} more schemas
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
