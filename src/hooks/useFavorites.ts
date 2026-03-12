import { useState, useEffect, useCallback } from 'react';

export interface FavoriteItem {
  id: number | string;
  type: 'live' | 'movie' | 'series';
  name: string;
  icon?: string;
  addedAt: number;
  playlistCode?: string; // tracks which playlist this item belongs to
}

const STORAGE_KEY = 'amtech_favorites';

function loadFavorites(): FavoriteItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveFavorites(items: FavoriteItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(loadFavorites);

  // Re-read on mount and focus for cross-component sync
  useEffect(() => {
    setFavorites(loadFavorites());
    const onFocus = () => setFavorites(loadFavorites());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const addFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    setFavorites(prev => {
      if (prev.some(f => String(f.id) === String(item.id) && f.type === item.type)) return prev;
      const next = [...prev, { ...item, addedAt: Date.now() }];
      saveFavorites(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: number | string, type: string) => {
    setFavorites(prev => {
      const next = prev.filter(f => !(String(f.id) === String(id) && f.type === type));
      saveFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: number | string, type: string) => {
    return favorites.some(f => String(f.id) === String(id) && f.type === type);
  }, [favorites]);

  const toggleFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    if (isFavorite(item.id, item.type)) {
      removeFavorite(item.id, item.type);
    } else {
      addFavorite(item);
    }
  }, [isFavorite, removeFavorite, addFavorite]);

  return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite };
}
