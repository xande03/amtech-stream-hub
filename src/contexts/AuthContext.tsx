import React, { createContext, useContext, useState, useCallback } from 'react';

interface AppContextType {
  accessCode: string | null;
  serverInfo: any | null;
  userInfo: any | null;
  playlistName: string | null;
  isConfigured: boolean;
  setConfig: (code: string, info?: any) => void;
  clearConfig: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'amtech_access_code';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessCode, setAccessCode] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [playlistName, setPlaylistName] = useState<string | null>(null);

  const setConfig = useCallback((code: string, info?: any) => {
    setAccessCode(code);
    localStorage.setItem(STORAGE_KEY, code);
    if (info) {
      setServerInfo(info.server_info);
      setUserInfo(info.user_info);
      setPlaylistName(info.playlist_name);
    }
  }, []);

  const clearConfig = useCallback(() => {
    setAccessCode(null);
    setServerInfo(null);
    setUserInfo(null);
    setPlaylistName(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AppContext.Provider value={{
      accessCode,
      serverInfo,
      userInfo,
      playlistName,
      isConfigured: !!accessCode,
      setConfig,
      clearConfig,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
