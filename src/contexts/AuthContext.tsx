import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { XtreamCredentials, AuthResponse, authenticate } from '@/services/xtreamApi';

interface AuthContextType {
  credentials: XtreamCredentials | null;
  authData: AuthResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (creds: XtreamCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'amtech_credentials';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [credentials, setCredentials] = useState<XtreamCredentials | null>(null);
  const [authData, setAuthData] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const creds = JSON.parse(saved) as XtreamCredentials;
        authenticate(creds)
          .then((data) => {
            setCredentials(creds);
            setAuthData(data);
          })
          .catch(() => {
            localStorage.removeItem(STORAGE_KEY);
          })
          .finally(() => setIsLoading(false));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (creds: XtreamCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authenticate(creds);
      setCredentials(creds);
      setAuthData(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setCredentials(null);
    setAuthData(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{
      credentials,
      authData,
      isAuthenticated: !!credentials && !!authData,
      isLoading,
      error,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
