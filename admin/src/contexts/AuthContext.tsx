'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/utils';

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

    const { data } = await api.get<User>('/auth/me');
    if (data) {
      setUser(data);
    } else {
      localStorage.removeItem('token');
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await api.post<{ access_token: string; user: User }>('/auth/login', {
      email,
      password,
    });

    if (error) throw new Error(error);

    localStorage.setItem('token', data!.access_token);
    setUser(data!.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const { data, error } = await api.post<{ access_token: string; user: User }>('/auth/register', {
      email,
      password,
      name,
    });

    if (error) throw new Error(error);

    localStorage.setItem('token', data!.access_token);
    setUser(data!.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
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
