'use client';

import { ActivityItem } from '@research-cms/shared-types';
import { API_URL } from '@/config';
import { useEffect, useState } from 'react';

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const response = await fetch(`${API_URL}/logs/activity?limit=20`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (response.ok) {
          setActivities(await response.json());
        }
      } catch (err) {
        console.error('Error fetching activity:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const tagColor = (tags: string[]) => {
    if (tags.includes('delete')) return 'text-red-500';
    if (tags.includes('create')) return 'text-green-500';
    if (tags.includes('update')) return 'text-blue-500';
    return 'text-zinc-500';
  };

  const groupByDate = (items: ActivityItem[]) => {
    return items.reduce(
      (groups, item) => {
        const date = item.createdAt.split('T')[0];
        if (!groups[date]) groups[date] = [];
        groups[date].push(item);
        return groups;
      },
      {} as Record<string, ActivityItem[]>
    );
  };

  if (loading) {
    return <div className="text-xs text-zinc-400">Loading activity…</div>;
  }

  const grouped = groupByDate(activities);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <p className="text-xs text-zinc-400 mb-2">
            {date === new Date().toISOString().split('T')[0] ? 'Today' : date}
          </p>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-start gap-2">
                <span className="text-xs text-zinc-400 whitespace-nowrap">
                  {new Date(item.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className={`text-sm ${tagColor(item.tags)}`}>{item.message}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
