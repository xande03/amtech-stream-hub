import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── LocalStorage Keys ────────────────────────────────────────────────────────
// All user-specific session data is stored ONLY in the user's browser localStorage.
// The cloud (Supabase) is used ONLY for managing playlists (admin-config).
const LS_ACCESS_CODE = 'xerife_access_code';
const LS_PLAYLIST_NAME = 'xerife_playlist_name';
const LS_SERVER_INFO = 'xerife_server_info';
const LS_USER_INFO = 'xerife_user_info';

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
  } catch { /* storage quota exceeded or private mode — fail silently */ }
}

function clearLocalConfig() {
  localStorage.removeItem(LS_ACCESS_CODE);
  localStorage.removeItem(LS_PLAYLIST_NAME);
  localStorage.removeItem(LS_SERVER_INFO);
  localStorage.removeItem(LS_USER_INFO);
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 1️⃣ Read from localStorage IMMEDIATELY — no network wait, instant boot
  const initial = readLocalConfig();
  const [accessCode, setAccessCode] = useState<string | null>(initial.accessCode);
  const [serverInfo, setServerInfo] = useState<any>(initial.serverInfo);
  const [userInfo, setUserInfo] = useState<any>(initial.userInfo);
  const [playlistName, setPlaylistName] = useState<string | null>(initial.playlistName);
  const [loaded, setLoaded] = useState(false);

  // 2️⃣ Background cloud fetch:
  //   - If user has NO local config → fetch active playlist from cloud & save to localStorage
  //   - If user HAS local config  → validate in background, update playlist name if changed
  //   This runs ONCE on mount (non-blocking: app already runs with local state)
  useEffect(() => {
    let cancelled = false;

    async function syncWithCloud() {
      const local = readLocalConfig();

      try {
        const { data } = await supabase.functions.invoke('admin-config', {
          body: { action: 'get_active_config' },
        });

        if (cancelled) return;

        if (data?.config) {
          if (!local.accessCode) {
            // First-time user: no local config yet → save cloud active playlist to localStorage
            const code = data.config.access_code;
            const name = data.config.playlist_name;
            setAccessCode(code);
            setPlaylistName(name);
            writeLocalConfig(code, name, null, null);
          } else if (local.accessCode === data.config.access_code) {
            // Same playlist — just refresh the name in case admin renamed it
            const name = data.config.playlist_name;
            setPlaylistName(name);
            writeLocalConfig(local.accessCode, name, local.serverInfo, local.userInfo);
          }
          // If user's local access code differs from cloud's active — respect user's local choice
        }
        // If cloud returned no config → keep user's local config (may still work)
      } catch {
        // Network error — continue with local config unchanged
      }

      if (!cancelled) setLoaded(true);
    }

    syncWithCloud();
    return () => { cancelled = true; };
  }, []);

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Called when user/admin selects or authenticates with a playlist.
   * Saves the session to localStorage — cloud is NOT involved for user data.
   */
  const setConfig = useCallback((code: string, info?: any) => {
    const name = info?.playlist_name ?? null;
    const srv = info?.server_info ?? null;
    const usr = info?.user_info ?? null;

    setAccessCode(code);
    setPlaylistName(name);
    if (srv !== null) setServerInfo(srv);
    if (usr !== null) setUserInfo(usr);

    // Persist user's session choice exclusively to localStorage
    writeLocalConfig(code, name, srv, usr);
  }, []);

  /**
   * Clear user session — removes data from localStorage ONLY.
   * Cloud playlists are completely unaffected.
   */
  const clearConfig = useCallback(() => {
    setAccessCode(null);
    setServerInfo(null);
    setUserInfo(null);
    setPlaylistName(null);
    clearLocalConfig();
  }, []);

  /**
   * Refresh: re-reads localStorage (instant) and triggers background cloud sync.
   * Used after admin makes playlist changes so active users see updates.
   */
  const refreshConfig = useCallback(() => {
    const local = readLocalConfig();
    setAccessCode(local.accessCode);
    setPlaylistName(local.playlistName);
    setServerInfo(local.serverInfo);
    setUserInfo(local.userInfo);

    // Re-sync with cloud in background
    supabase.functions.invoke('admin-config', {
      body: { action: 'get_active_config' },
    }).then(({ data }) => {
      if (data?.config) {
        const name = data.config.playlist_name;
        setPlaylistName(name);
        writeLocalConfig(local.accessCode, name, local.serverInfo, local.userInfo);
      }
    }).catch(() => { /* ignore */ });
  }, []);

  // Don't block render — show app immediately with local data
  // (loaded flag is only for first-time users who need the initial cloud fetch)
  if (!loaded && !initial.accessCode) {
    // Only block if there's NO local config at all (truly first visit)
    // We need to know if there's a cloud playlist before rendering routes
    return null;
  }

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
