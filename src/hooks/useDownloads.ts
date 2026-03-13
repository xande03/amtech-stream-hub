import { useState, useCallback, useEffect } from 'react';

export interface DownloadItem {
  id: string | number;
  type: 'movie' | 'series';
  name: string;
  icon: string;
  url: string;
  /** For series episodes */
  episodeInfo?: string;
  episodeTitle?: string;
  seriesId?: number;
  /** Download status */
  status: 'downloading' | 'completed' | 'error';
  progress: number;
  addedAt: number;
  fileSize?: string;
}

const STORAGE_KEY = 'app_downloads';

function loadDownloads(): DownloadItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveDownloads(items: DownloadItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadItem[]>(loadDownloads);

  useEffect(() => {
    const handleStorage = () => setDownloads(loadDownloads());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const sync = useCallback((updater: (prev: DownloadItem[]) => DownloadItem[]) => {
    setDownloads(prev => {
      const next = updater(prev);
      saveDownloads(next);
      return next;
    });
  }, []);

  const startDownload = useCallback((item: Omit<DownloadItem, 'status' | 'progress' | 'addedAt'>) => {
    const key = `${item.id}-${item.type}-${item.episodeInfo || ''}`;
    
    sync(prev => {
      // Don't add duplicates
      if (prev.some(d => `${d.id}-${d.type}-${d.episodeInfo || ''}` === key)) return prev;
      return [...prev, { ...item, status: 'downloading' as const, progress: 0, addedAt: Date.now() }];
    });

    // Trigger actual browser download
    triggerBrowserDownload(item.url, item.name, item.episodeInfo);

    // Simulate progress (since browser downloads are handled natively)
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        sync(prev => prev.map(d =>
          `${d.id}-${d.type}-${d.episodeInfo || ''}` === key
            ? { ...d, status: 'completed' as const, progress: 100 }
            : d
        ));
      } else {
        sync(prev => prev.map(d =>
          `${d.id}-${d.type}-${d.episodeInfo || ''}` === key
            ? { ...d, progress: Math.min(progress, 99) }
            : d
        ));
      }
    }, 800);
  }, [sync]);

  const removeDownload = useCallback((id: string | number, type: string, episodeInfo?: string) => {
    sync(prev => prev.filter(d => !(String(d.id) === String(id) && d.type === type && (d.episodeInfo || '') === (episodeInfo || ''))));
  }, [sync]);

  const clearAll = useCallback(() => {
    sync(() => []);
  }, [sync]);

  const isDownloaded = useCallback((id: string | number, type: string, episodeInfo?: string): boolean => {
    return downloads.some(d => String(d.id) === String(id) && d.type === type && (d.episodeInfo || '') === (episodeInfo || ''));
  }, [downloads]);

  const getDownloadStatus = useCallback((id: string | number, type: string, episodeInfo?: string): DownloadItem | undefined => {
    return downloads.find(d => String(d.id) === String(id) && d.type === type && (d.episodeInfo || '') === (episodeInfo || ''));
  }, [downloads]);

  const movieDownloads = downloads.filter(d => d.type === 'movie');
  const seriesDownloads = downloads.filter(d => d.type === 'series');

  return { downloads, movieDownloads, seriesDownloads, startDownload, removeDownload, clearAll, isDownloaded, getDownloadStatus };
}

function triggerBrowserDownload(url: string, name: string, episodeInfo?: string) {
  const filename = episodeInfo ? `${name} - ${episodeInfo}` : name;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
