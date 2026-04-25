'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { getPublicSettings } from '@/app/actions';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  settings: Record<string, unknown>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();

  const fetchingRef = useRef(false);

  const fetchSettings = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await getPublicSettings({ scope: 'global' });
      if (err) setError(err);
      else setSettings(data ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchSettings();
  }, [user, authLoading]);

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refetch: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

/**
 * Read a single global public setting by key, with a typed fallback.
 * Returns the fallback while settings are loading or if the key is missing.
 */
export function useSetting<T>(key: string, fallback: T): T {
  const { settings } = useSettings();
  const value = settings[key];
  return (value === undefined || value === null) ? fallback : (value as T);
}
