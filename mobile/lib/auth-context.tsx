import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { registerUser, loginUser, getCurrentUser, EndUser } from '@/lib/api';
import { getToken, setToken, clearToken } from '@/lib/token-storage';

interface AuthContextType {
  user: EndUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EndUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        setUser(await getCurrentUser(token));
      } catch {
        await clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedInUser, token } = await loginUser(email, password);
    await setToken(token);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const { user: newUser, token } = await registerUser(email, password, name);
    await setToken(token);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useEndUserAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useEndUserAuth must be used within AuthProvider');
  }
  return context;
}
