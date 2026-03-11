import { useState, useEffect, useCallback } from 'react';

export interface WatchHistoryItem {
  id: number | string;
  type: 'live' | 'movie' | 'series';
  name: string;
  icon?: string;
  progress?: number; // 0-100
  currentTime?: number; // seconds
  duration?: number; // seconds
  lastWatched: number;
  episodeInfo?: string;
}

const STORAGE_KEY = 'amtech_history';
const MAX_ITEMS = 50;

function loadHistory(): WatchHistoryItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveHistory(items: WatchHistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>(loadHistory);

  // Sync from localStorage on mount and on window focus (cross-component sync)
  useEffect(() => {
    setHistory(loadHistory());
    const onFocus = () => setHistory(loadHistory());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const addToHistory = useCallback((item: Omit<WatchHistoryItem, 'lastWatched'>) => {
    setHistory(prev => {
      const filtered = prev.filter(h => !(String(h.id) === String(item.id) && h.type === item.type));
      const next = [{ ...item, lastWatched: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      saveHistory(next);
      return next;
    });
  }, []);

  const updateProgress = useCallback((id: number | string, type: string, progress: number, currentTime?: number, duration?: number) => {
    setHistory(prev => {
      // Always read fresh from localStorage to catch items added by other components
      let current = loadHistory();
      // If item not found anywhere, skip (will be added by addToHistory later)
      if (!current.some(h => String(h.id) === String(id) && h.type === type)) {
        // Also check prev state
        if (prev.some(h => String(h.id) === String(id) && h.type === type)) {
          current = prev;
        } else {
          return prev;
        }
      }
      const next = current.map(h =>
        String(h.id) === String(id) && h.type === type
          ? { ...h, progress, currentTime, duration, lastWatched: Date.now() }
          : h
      );
      saveHistory(next);
      return next;
    });
  }, []);

  const getResumeTime = useCallback((id: number | string, type: string): number => {
    // Read fresh from localStorage for accuracy
    const items = loadHistory();
    const item = items.find(h => String(h.id) === String(id) && h.type === type);
    if (item?.currentTime && item?.progress && item.progress < 95) {
      return item.currentTime;
    }
    return 0;
  }, []);

  const removeFromHistory = useCallback((id: number | string, type: string) => {
    setHistory(prev => {
      const next = prev.filter(h => !(String(h.id) === String(id) && h.type === type));
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    saveHistory([]);
    setHistory([]);
  }, []);

  return { history, addToHistory, updateProgress, removeFromHistory, clearHistory, getResumeTime };
}
