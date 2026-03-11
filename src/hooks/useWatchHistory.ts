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

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addToHistory = useCallback((item: Omit<WatchHistoryItem, 'lastWatched'>) => {
    setHistory(prev => {
      const filtered = prev.filter(h => !(h.id === item.id && h.type === item.type));
      return [{ ...item, lastWatched: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  const updateProgress = useCallback((id: number | string, type: string, progress: number, currentTime?: number, duration?: number) => {
    setHistory(prev => prev.map(h =>
      String(h.id) === String(id) && h.type === type
        ? { ...h, progress, currentTime, duration, lastWatched: Date.now() }
        : h
    ));
  }, []);

  const getResumeTime = useCallback((id: number | string, type: string): number => {
    const item = history.find(h => String(h.id) === String(id) && h.type === type);
    if (item?.currentTime && item?.progress && item.progress < 95) {
      return item.currentTime;
    }
    return 0;
  }, [history]);

  const removeFromHistory = useCallback((id: number | string, type: string) => {
    setHistory(prev => prev.filter(h => !(String(h.id) === String(id) && h.type === type)));
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return { history, addToHistory, updateProgress, removeFromHistory, clearHistory, getResumeTime };
}
