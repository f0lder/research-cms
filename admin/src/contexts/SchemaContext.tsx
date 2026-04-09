'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ContentTypeDefinition } from '@research-cms/shared-types';
import { getAllSchemas, getSystemSchemas } from '@/app/actions';

interface SchemaContextType {
  schemas: ContentTypeDefinition[];
  systemSchemas: ContentTypeDefinition[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const SchemaContext = createContext<SchemaContextType | undefined>(undefined);

export function SchemaProvider({ children }: { children: ReactNode }) {
  const [schemas, setSchemas] = useState<ContentTypeDefinition[]>([]);
  const [systemSchemas, setSystemSchemas] = useState<ContentTypeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemas = async () => {
    try {
      setLoading(true);
      setError(null);
      const [userRes, systemRes] = await Promise.all([
        getAllSchemas(),
        getSystemSchemas(),
      ]);
      
      if (userRes.error) {
        setError(userRes.error);
      } else {
        setSchemas(userRes.data ?? []);
      }
      
      if (systemRes.error) {
        setError(systemRes.error);
      } else {
        setSystemSchemas(systemRes.data ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schemas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemas();
  }, []);

  return (
    <SchemaContext.Provider value={{ schemas, systemSchemas, loading, error, refetch: fetchSchemas }}>
      {children}
    </SchemaContext.Provider>
  );
}

export function useSchemas() {
  const context = useContext(SchemaContext);
  if (!context) {
    throw new Error('useSchemas must be used within SchemaProvider');
  }
  return context;
}
