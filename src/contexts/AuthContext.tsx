import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ─── LocalStorage Keys ────────────────────────────────────────────────────────
// ALL data is stored exclusively in localStorage. No cloud dependency.
const LS_ACCESS_CODE = 'xerife_access_code';
const LS_PLAYLIST_NAME = 'xerife_playlist_name';
const LS_SERVER_INFO = 'xerife_server_info';
const LS_USER_INFO = 'xerife_user_info';
const LS_ADMIN_PLAYLISTS = 'xerife_admin_playlists';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── LocalStorage Helpers ─────────────────────────────────────────────────────
function readLocalConfig() {
  try {
    return {
      accessCode: localStorage.getItem(LS_ACCESS_CODE) || null,
      playlistName: localStorage.getItem(LS_PLAYLIST_NAME) || null,
      serverInfo: (() => { try { const v = localStorage.getItem(LS_SERVER_INFO); return v ? JSON.parse(v) : null; } catch { return null; } })(),
      userInfo: (() => { try { const v = localStorage.getItem(LS_USER_INFO); return v ? JSON.parse(v) : null; } catch { return null; } })(),
    };
  } catch {
    return { accessCode: null, playlistName: null, serverInfo: null, userInfo: null };
  }
}

function writeLocalConfig(
  code: string | null,
  name: string | null,
  serverInfo?: any,
  userInfo?: any
) {
  try {
    if (code) localStorage.setItem(LS_ACCESS_CODE, code);
    else localStorage.removeItem(LS_ACCESS_CODE);

    if (name) localStorage.setItem(LS_PLAYLIST_NAME, name);
    else localStorage.removeItem(LS_PLAYLIST_NAME);

    if (serverInfo) localStorage.setItem(LS_SERVER_INFO, JSON.stringify(serverInfo));
    else localStorage.removeItem(LS_SERVER_INFO);

    if (userInfo) localStorage.setItem(LS_USER_INFO, JSON.stringify(userInfo));
    else localStorage.removeItem(LS_USER_INFO);
  } catch { /* storage quota exceeded or private mode */ }
}

function clearLocalConfig() {
  localStorage.removeItem(LS_ACCESS_CODE);
  localStorage.removeItem(LS_PLAYLIST_NAME);
  localStorage.removeItem(LS_SERVER_INFO);
  localStorage.removeItem(LS_USER_INFO);
}

/** Read the active playlist from admin's localStorage (no cloud needed) */
function getActivePlaylistFromLocal(): { accessCode: string; playlistName: string; serverUrl: string; username: string; password: string } | null {
  try {
    const raw = localStorage.getItem(LS_ADMIN_PLAYLISTS);
    if (!raw) return null;
    const list = JSON.parse(raw);
    const active = list.find((p: any) => p.is_active);
    if (!active) return null;
    return {
      accessCode: active.access_code,
      playlistName: active.playlist_name,
      serverUrl: active.server_url,
      username: active.username,
      password: active.password,
    };
  } catch { return null; }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initial = readLocalConfig();
  const [accessCode, setAccessCode] = useState<string | null>(initial.accessCode);
  const [serverInfo, setServerInfo] = useState<any>(initial.serverInfo);
  const [userInfo, setUserInfo] = useState<any>(initial.userInfo);
  const [playlistName, setPlaylistName] = useState<string | null>(initial.playlistName);

  // On mount: if no user config but admin has playlists, auto-configure from active playlist
  useEffect(() => {
    if (!initial.accessCode) {
      const active = getActivePlaylistFromLocal();
      if (active) {
        setAccessCode(active.accessCode);
        setPlaylistName(active.playlistName);
        writeLocalConfig(active.accessCode, active.playlistName, null, null);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setConfig = useCallback((code: string, info?: any) => {
    const name = info?.playlist_name ?? null;
    const srv = info?.server_info ?? null;
    const usr = info?.user_info ?? null;

    setAccessCode(code);
    setPlaylistName(name);
    if (srv !== null) setServerInfo(srv);
    if (usr !== null) setUserInfo(usr);

    writeLocalConfig(code, name, srv, usr);
  }, []);

  const clearConfig = useCallback(() => {
    setAccessCode(null);
    setServerInfo(null);
    setUserInfo(null);
    setPlaylistName(null);
    clearLocalConfig();
  }, []);

  const refreshConfig = useCallback(() => {
    // Re-read from localStorage (admin may have changed playlists)
    const active = getActivePlaylistFromLocal();
    if (active) {
      setAccessCode(active.accessCode);
      setPlaylistName(active.playlistName);
      writeLocalConfig(active.accessCode, active.playlistName, null, null);
    } else {
      const local = readLocalConfig();
      setAccessCode(local.accessCode);
      setPlaylistName(local.playlistName);
      setServerInfo(local.serverInfo);
      setUserInfo(local.userInfo);
    }
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
      refreshConfig,
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
