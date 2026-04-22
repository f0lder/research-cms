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
      <div className="bg-surface border-2 border-on-surface p-6">
        <div className="h-6 bg-surface-container rounded w-32 animate-pulse mb-4" />
        <div className="h-64 bg-surface-container-low rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface border-2 border-on-surface p-6">
        <h3 className="text-h3 font-bold mb-3 uppercase">Usage Analytics</h3>
        <div className="alert-error text-code">{error}</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-surface border-2 border-on-surface p-6">
        <h3 className="text-h3 font-bold mb-3 uppercase">Usage Analytics</h3>
        <p className="text-on-surface-variant text-body-md">No usage data yet.</p>
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
    <div className="bg-surface border-2 border-on-surface p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6 mb-6">
        <h3 className="text-h3 font-bold uppercase">Usage Analytics</h3>
        <div className="flex flex-wrap gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-2 text-code font-bold uppercase border-2 transition-all ${
                days === d
                  ? 'bg-primary text-white border-on-surface shadow-hard'
                  : 'bg-surface-container text-on-surface border-on-surface hover:bg-white'
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-2 text-code font-bold uppercase bg-red-100 text-red-600 border-2 border-red-600 hover:bg-red-600 hover:text-white transition-all whitespace-nowrap"
          >
            Clear Data
          </button>
        </div>
      </div>

      {showClearConfirm && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-600">
          <p className="text-body-md text-red-600 mb-3 font-bold">
            Are you sure? This will permanently delete all usage data for this API key.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleClear}
              disabled={clearing}
              className="px-3 py-2 text-code font-bold bg-red-600 text-white hover:opacity-90 disabled:opacity-50 uppercase order-2 sm:order-1 border-2 border-red-600"
            >
              {clearing ? 'Clearing...' : 'Delete All Data'}
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              disabled={clearing}
              className="px-3 py-2 text-code font-bold bg-surface-container text-on-surface hover:bg-white disabled:opacity-50 uppercase order-1 sm:order-2 border-2 border-on-surface"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="border-l-4 border-primary pl-4">
          <div className="text-code text-on-surface-variant uppercase font-bold">
            {selectedUser ? 'User Activity Days' : 'Unique Users'}
          </div>
          <div className="text-h1 font-black text-on-surface mt-1">
            {selectedUser
              ? (filteredData.length).toLocaleString()
              : (data.reduce((max, d) => Math.max(max, d.userCount), 0)).toLocaleString()}
          </div>
        </div>
        <div className="border-l-4 border-primary pl-4">
          <div className="text-code text-on-surface-variant uppercase font-bold">
            {selectedUser ? 'Schemas Used' : 'Avg Users/Day'}
          </div>
          <div className="text-h1 font-black text-on-surface mt-1">
            {selectedUser
              ? schemaBreakdownList.length
              : Math.round(data.reduce((sum, d) => sum + d.userCount, 0) / data.length).toLocaleString()}
          </div>
        </div>
        <div className="border-l-4 border-primary pl-4">
          <div className="text-code text-on-surface-variant uppercase font-bold">Total Schemas</div>
          <div className="text-h1 font-black text-on-surface mt-1">{allSchemas.size}</div>
        </div>
      </div>

      {/* User list and timeline section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {/* User list */}
        <div className="md:col-span-1 lg:col-span-1 order-2 md:order-1">
          <h4 className="text-label text-on-surface mb-3 uppercase">Unique Users ({uniqueUsers.size})</h4>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {usersList.map(([user, days]) => (
              <button
                key={user}
                onClick={() => setSelectedUser(selectedUser === user ? null : user)}
                className={`w-full text-left px-3 py-2 text-code font-bold uppercase transition-all border-2 ${
                  selectedUser === user
                    ? 'bg-primary text-white border-on-surface shadow-hard'
                    : 'bg-surface-container text-on-surface-variant border-on-surface hover:bg-white'
                }`}
              >
                <div className="truncate">{user}</div>
                <div className="text-code opacity-75">{days}d active</div>
              </button>
            ))}
            {uniqueUsers.size > 20 && (
              <p className="text-code text-on-surface-variant text-center py-2">+{uniqueUsers.size - 20} more</p>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="md:col-span-1 lg:col-span-3 order-1 md:order-2">
          <h4 className="text-label text-on-surface mb-3 uppercase">
            {selectedUser ? `Activity Timeline - ${selectedUser}` : 'Unique Users by Day'}
          </h4>
          <div className="flex items-end gap-0.5 md:gap-1 h-24 md:h-32">
            {filteredData.map(d => {
              const maxUserCount = Math.max(...filteredData.map(x => selectedUser ? 1 : x.userCount), 1);
              const heightPercent = selectedUser ? 100 : (d.userCount / maxUserCount) * 100;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full hover:opacity-80 transition border-2 border-on-surface ${
                      selectedUser ? 'bg-primary' : 'bg-primary'
                    }`}
                    style={{ height: `${heightPercent}%`, minHeight: '2px' }}
                    title={selectedUser ? `${d.date}` : `${d.date}: ${d.userCount} unique users`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-code text-on-surface-variant mt-2">
            <span>{filteredData[0]?.date}</span>
            <span>{filteredData[filteredData.length - 1]?.date}</span>
          </div>
        </div>
      </div>

      {/* Per-schema breakdown */}
      {schemaBreakdownList.length > 0 && (
        <div>
          <h4 className="text-label text-on-surface mb-3 uppercase">
            {selectedUser ? `Schemas Used by ${selectedUser}` : `Top Schemas by Unique Users`}
          </h4>
          <div className="space-y-2 overflow-x-auto">
            {schemaBreakdownList.slice(0, 10).map(([schema, users]) => (
              <div key={schema} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                <div className="w-full md:w-24 text-code truncate text-on-surface font-bold flex-shrink-0 uppercase">
                  {schema || 'unknown'}
                </div>
                <div className="flex-1 bg-surface-container-low border-2 border-on-surface overflow-hidden h-6">
                  <div
                    className="bg-primary h-6 transition-all"
                    style={{ width: `${(users / maxSchemaUsers) * 100}%` }}
                  />
                </div>
                <div className="w-full md:w-12 text-right text-code font-bold text-on-surface flex-shrink-0 uppercase">
                  {users}
                </div>
              </div>
            ))}
            {schemaBreakdownList.length > 10 && (
              <p className="text-code text-on-surface-variant pt-2">
                +{schemaBreakdownList.length - 10} more schemas
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
