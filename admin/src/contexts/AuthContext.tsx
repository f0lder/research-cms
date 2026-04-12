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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Ensure token is also in cookie for server-side requests
    await fetch('/api/auth/set-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).catch(console.error);

    const { data, error } = await api.get<User>('/auth/me');
    if (data) {
      setUser(data);
    } else if (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      await fetch('/api/auth/logout', { method: 'POST' }).catch(console.error);
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await api.post<{ access_token: string; user: User }>('/auth/login', {
      email,
      password,
    });

    if (error) throw new Error(error);
    if (!data) throw new Error('No response data');

    const token = data.access_token;
    localStorage.setItem('token', token);

    // Set token as HTTP-only cookie FIRST - this is critical for middleware
    const cookieResponse = await fetch('/api/auth/set-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!cookieResponse.ok) {
      throw new Error('Failed to set authentication cookie');
    }

    // Only update context AFTER cookie is confirmed set
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const { data, error } = await api.post<{ access_token: string; user: User }>('/auth/register', {
      email,
      password,
      name,
    });

    if (error) throw new Error(error);
    if (!data) throw new Error('No response data');

    const token = data.access_token;
    localStorage.setItem('token', token);

    // Set token as HTTP-only cookie FIRST - this is critical for middleware
    const cookieResponse = await fetch('/api/auth/set-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!cookieResponse.ok) {
      throw new Error('Failed to set authentication cookie');
    }

    // Only update context AFTER cookie is confirmed set
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Clear HTTP-only cookie
    fetch('/api/auth/logout', { method: 'POST' }).catch(console.error);
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
