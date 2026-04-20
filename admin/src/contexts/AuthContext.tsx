'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await api.get<User>('/auth/me');
      if (data) {
        setUser(data);
      }
    } catch (e) {
      console.error('Auth check failed:', e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await api.post<{ user: User }>('/auth/login', {
      email,
      password,
    });

    if (error) throw new Error(error);
    if (!data) throw new Error('No response data');

    // Session cookie is automatically set by API
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const { data, error } = await api.post<{ user: User }>('/auth/register', {
      email,
      password,
      name,
    });

    if (error) throw new Error(error);
    if (!data) throw new Error('No response data');

    // Session cookie is automatically set by API
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

