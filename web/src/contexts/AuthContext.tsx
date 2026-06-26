import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { registerUser, loginUser, getCurrentUser, EndUser } from '@/lib/api';

const TOKEN_KEY = 'cms_end_user_token';

interface AuthContextType {
  user: EndUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EndUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    getCurrentUser(token)
      .then(setUser)
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedInUser, token } = await loginUser(email, password);
    window.localStorage.setItem(TOKEN_KEY, token);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const { user: newUser, token } = await registerUser(email, password, name);
    window.localStorage.setItem(TOKEN_KEY, token);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
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
