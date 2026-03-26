import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LiveStream, VodStream, Series, Category } from '@/services/xtreamApi';

interface ContentCache {
  liveCategories: Category[];
  vodCategories: Category[];
  seriesCategories: Category[];
  liveStreams: Record<string, LiveStream[]>;
  vodStreams: Record<string, VodStream[]>;
  seriesList: Record<string, Series[]>;
  lastUpdated: number | null;
  
  setLiveCategories: (categories: Category[]) => void;
  setVodCategories: (categories: Category[]) => void;
  setSeriesCategories: (categories: Category[]) => void;
  setLiveStreams: (categoryId: string, streams: LiveStream[]) => void;
  setVodStreams: (categoryId: string, streams: VodStream[]) => void;
  setSeriesList: (categoryId: string, series: Series[]) => void;
  clearCache: () => void;
  isStale: () => boolean;
}

const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export const useContentCache = create<ContentCache>()(
  persist(
    (set, get) => ({
      liveCategories: [],
      vodCategories: [],
      seriesCategories: [],
      liveStreams: {},
      vodStreams: {},
      seriesList: {},
      lastUpdated: null,

      setLiveCategories: (categories) => 
        set({ liveCategories: categories, lastUpdated: Date.now() }),
      
      setVodCategories: (categories) => 
        set({ vodCategories: categories, lastUpdated: Date.now() }),
      
      setSeriesCategories: (categories) => 
        set({ seriesCategories: categories, lastUpdated: Date.now() }),
      
      setLiveStreams: (categoryId, streams) => 
        set((state) => ({
          liveStreams: { ...state.liveStreams, [categoryId]: streams },
          lastUpdated: Date.now(),
        })),
      
      setVodStreams: (categoryId, streams) => 
        set((state) => ({
          vodStreams: { ...state.vodStreams, [categoryId]: streams },
          lastUpdated: Date.now(),
        })),
      
      setSeriesList: (categoryId, series) => 
        set((state) => ({
          seriesList: { ...state.seriesList, [categoryId]: series },
          lastUpdated: Date.now(),
        })),
      
      clearCache: () => 
        set({
          liveCategories: [],
          vodCategories: [],
          seriesCategories: [],
          liveStreams: {},
          vodStreams: {},
          seriesList: {},
          lastUpdated: null,
        }),
      
      isStale: () => {
        const { lastUpdated } = get();
        if (!lastUpdated) return true;
        return Date.now() - lastUpdated > CACHE_DURATION;
      },
    }),
    {
      name: 'xerife-content-cache',
      version: 1,
    }
  )
);
