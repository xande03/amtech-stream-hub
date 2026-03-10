import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authenticateWithCode } from '@/services/xtreamApi';

interface AuthContextType {
  accessCode: string | null;
  serverInfo: any | null;
  userInfo: any | null;
  playlistName: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'amtech_access_code';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [playlistName, setPlaylistName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      authenticateWithCode(saved)
        .then((data) => {
          setAccessCode(saved);
          setServerInfo(data.server_info);
          setUserInfo(data.user_info);
          setPlaylistName(data.playlist_name);
        })
        .catch(() => {
          localStorage.removeItem(STORAGE_KEY);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authenticateWithCode(code.trim());
      setAccessCode(code.trim());
      setServerInfo(data.server_info);
      setUserInfo(data.user_info);
      setPlaylistName(data.playlist_name);
      localStorage.setItem(STORAGE_KEY, code.trim());
    } catch (err: any) {
      setError(err.message || 'Código inválido');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAccessCode(null);
    setServerInfo(null);
    setUserInfo(null);
    setPlaylistName(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{
      accessCode,
      serverInfo,
      userInfo,
      playlistName,
      isAuthenticated: !!accessCode,
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
