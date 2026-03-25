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
  const [accessCode, setAccessCode] = useState<string | null>(() => localStorage.getItem('xerife_access_code'));
  const [serverInfo, setServerInfo] = useState<any>(() => {
    const saved = localStorage.getItem('xerife_server_info');
    return saved ? JSON.parse(saved) : null;
  });
  const [userInfo, setUserInfo] = useState<any>(null);
  const [playlistName, setPlaylistName] = useState<string | null>(() => localStorage.getItem('xerife_playlist_name'));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Limpeza de cache se o projeto Supabase mudar (migração)
    const currentProject = import.meta.env.VITE_SUPABASE_URL;
    const lastProject = localStorage.getItem('xerife_last_project');
    
    if (lastProject && lastProject !== currentProject) {
      console.log('Detectada mudança de projeto Supabase. Limpando cache para garantir funcionamento de ponta a ponta...');
      localStorage.removeItem('xerife_access_code');
      localStorage.removeItem('xerife_playlist_name');
      localStorage.removeItem('xerife_server_info');
      localStorage.removeItem('xerife_admin_pass');
    }
    localStorage.setItem('xerife_last_project', currentProject);
  }, []);

  const fetchActiveConfig = useCallback(async () => {
    try {
      // Reativando a sincronização direta com o banco de dados original (admin_config)
      const { data: config, error } = await supabase
        .from('admin_config')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (config) {
        setAccessCode(config.access_code);
        setPlaylistName(config.playlist_name);
        const sInfo = {
          server_url: config.server_url,
          username: config.username,
          password: config.password,
          playlist_name: config.playlist_name
        };
        setServerInfo(sInfo);
        localStorage.setItem('xerife_access_code', config.access_code);
        localStorage.setItem('xerife_playlist_name', config.playlist_name);
        localStorage.setItem('xerife_server_info', JSON.stringify(sInfo));
      } else {
        // Fallback to local
        const savedCode = localStorage.getItem('xerife_access_code');
        const savedInfo = localStorage.getItem('xerife_server_info');
        if (savedCode) {
          setAccessCode(savedCode);
          setPlaylistName(localStorage.getItem('xerife_playlist_name') || 'Minha Playlist');
          if (savedInfo) setServerInfo(JSON.parse(savedInfo));
        }
      }
    } catch (e) { 
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
      setServerInfo(info.server_info || info);
      setUserInfo(info.user_info);
      setPlaylistName(info.playlist_name);
      localStorage.setItem('xerife_playlist_name', info.playlist_name);
      localStorage.setItem('xerife_server_info', JSON.stringify(info.server_info || info));
    }
  }, []);

  const clearConfig = useCallback(() => {
    setAccessCode(null);
    setServerInfo(null);
    setUserInfo(null);
    setPlaylistName(null);
    localStorage.removeItem('xerife_access_code');
    localStorage.removeItem('xerife_playlist_name');
    localStorage.removeItem('xerife_server_info');
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
