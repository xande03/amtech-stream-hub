import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppContextType {
  accessCode: string | null;
  serverInfo: any | null;
  userInfo: any | null;
  playlistName: string | null;
  isConfigured: boolean;
  setConfig: (code: string, info?: any) => void;
  clearConfig: () => void;
  refreshConfig: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [playlistName, setPlaylistName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchActiveConfig = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke('admin-config', {
        body: { action: 'get_active_config' },
      });
      if (data?.config) {
        setAccessCode(data.config.access_code);
        setPlaylistName(data.config.playlist_name);
        localStorage.setItem('xerife_access_code', data.config.access_code);
        localStorage.setItem('xerife_playlist_name', data.config.playlist_name);
      } else {
        // Fallback to local if network fails but still continue
        const savedCode = localStorage.getItem('xerife_access_code');
        if (savedCode) {
          setAccessCode(savedCode);
          setPlaylistName(localStorage.getItem('xerife_playlist_name') || 'Minha Playlist');
        }
      }
    } catch { 
      // Fallback on error
      const savedCode = localStorage.getItem('xerife_access_code');
      if (savedCode) {
        setAccessCode(savedCode);
        setPlaylistName(localStorage.getItem('xerife_playlist_name') || 'Minha Playlist');
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchActiveConfig();
  }, [fetchActiveConfig]);

  const setConfig = useCallback((code: string, info?: any) => {
    setAccessCode(code);
    localStorage.setItem('xerife_access_code', code);
    if (info) {
      setServerInfo(info.server_info);
      setUserInfo(info.user_info);
      setPlaylistName(info.playlist_name);
      localStorage.setItem('xerife_playlist_name', info.playlist_name);
    }
  }, []);

  const clearConfig = useCallback(() => {
    setAccessCode(null);
    setServerInfo(null);
    setUserInfo(null);
    setPlaylistName(null);
    localStorage.removeItem('xerife_access_code');
    localStorage.removeItem('xerife_playlist_name');
  }, []);

  if (!loaded) return null; // Wait until config is fetched

  return (
    <AppContext.Provider value={{
      accessCode,
      serverInfo,
      userInfo,
      playlistName,
      isConfigured: !!accessCode,
      setConfig,
      clearConfig,
      refreshConfig: fetchActiveConfig,
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
