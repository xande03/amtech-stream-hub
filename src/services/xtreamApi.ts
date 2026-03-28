import { supabase } from '@/integrations/supabase/client';

export interface LiveStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export interface VodStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  rating: string;
  rating_5based: number;
  added: string;
  category_id: string;
  container_extension: string;
  custom_sid: string;
  direct_source: string;
  plot?: string;
  genre?: string;
  releaseDate?: string;
  duration?: string;
  cast?: string;
  director?: string;
}

export interface Series {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  releaseDate: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  backdrop_path: string[];
  youtube_trailer: string;
  episode_run_time: string;
  category_id: string;
}

export interface SeriesInfo {
  seasons: Record<string, any>;
  info: Series;
  episodes: Record<string, Episode[]>;
}

export interface Episode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info: {
    duration_secs?: number;
    duration?: string;
    plot?: string;
    releasedate?: string;
    movie_image?: string;
    rating?: number;
  };
  season: number;
  direct_source: string;
}

export interface Category {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface StreamUrlInfo {
  server_url: string;
  username: string;
  password: string;
}

// ─── LocalStorage API Cache ────────────────────────────────────────────────
const API_CACHE_PREFIX = 'xerife_api_';
const API_CACHE_TTL: Record<string, number> = {
  get_live_categories: 1000 * 60 * 60,      // 1 hour
  get_vod_categories: 1000 * 60 * 60,       // 1 hour
  get_series_categories: 1000 * 60 * 60,    // 1 hour
  get_live_streams: 1000 * 60 * 30,         // 30 min
  get_vod_streams: 1000 * 60 * 30,          // 30 min
  get_series: 1000 * 60 * 30,              // 30 min
  get_series_info: 1000 * 60 * 60 * 2,     // 2 hours
  get_vod_info: 1000 * 60 * 60 * 2,        // 2 hours
  get_short_epg: 1000 * 60 * 5,            // 5 min (EPG changes often)
};

function getCacheKey(body: Record<string, any>): string {
  const { action, category_id, series_id, vod_id, stream_id } = body;
  return `${API_CACHE_PREFIX}${action}_${category_id || series_id || vod_id || stream_id || 'all'}`;
}

function getFromCache<T>(key: string, ttl: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > ttl) {
      localStorage.removeItem(key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

function setCache(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Storage quota — evict oldest API caches
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(API_CACHE_PREFIX)) keys.push(k);
      }
      // Remove oldest 25%
      keys.sort();
      keys.slice(0, Math.ceil(keys.length / 4)).forEach(k => localStorage.removeItem(k));
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* give up */ }
  }
}

// Actions that should NOT be cached (mutations, stream URLs, auth)
const NO_CACHE_ACTIONS = new Set([
  'authenticate', 'get_stream_url', 'proxy_stream', 'check_channels',
]);

async function callProxy(body: Record<string, any>) {
  const action = body.action as string;

  // Try cache first for read-only actions
  if (!NO_CACHE_ACTIONS.has(action)) {
    const ttl = API_CACHE_TTL[action] || 1000 * 60 * 15; // default 15 min
    const cacheKey = getCacheKey(body);
    const cached = getFromCache(cacheKey, ttl);
    if (cached) return cached;

    // Fetch from cloud
    const { data, error } = await supabase.functions.invoke('xtream-proxy', { body });
    if (error) throw new Error(error.message || 'Erro na requisição');
    if (data?.error) throw new Error(data.error);

    // Cache the result
    setCache(cacheKey, data);
    return data;
  }

  // Non-cacheable actions
  const { data, error } = await supabase.functions.invoke('xtream-proxy', { body });
  if (error) throw new Error(error.message || 'Erro na requisição');
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function authenticateWithCode(accessCode: string) {
  return callProxy({ action: 'authenticate', access_code: accessCode });
}

export async function getLiveCategories(accessCode: string): Promise<Category[]> {
  return callProxy({ action: 'get_live_categories', access_code: accessCode });
}

export async function getLiveStreams(accessCode: string, categoryId?: string): Promise<LiveStream[]> {
  return callProxy({ action: 'get_live_streams', access_code: accessCode, category_id: categoryId });
}

export async function getVodCategories(accessCode: string): Promise<Category[]> {
  return callProxy({ action: 'get_vod_categories', access_code: accessCode });
}

export async function getVodStreams(accessCode: string, categoryId?: string): Promise<VodStream[]> {
  return callProxy({ action: 'get_vod_streams', access_code: accessCode, category_id: categoryId });
}

export async function getSeriesCategories(accessCode: string): Promise<Category[]> {
  return callProxy({ action: 'get_series_categories', access_code: accessCode });
}

export async function getSeriesList(accessCode: string, categoryId?: string): Promise<Series[]> {
  return callProxy({ action: 'get_series', access_code: accessCode, category_id: categoryId });
}

export async function getSeriesInfo(accessCode: string, seriesId: number): Promise<SeriesInfo> {
  return callProxy({ action: 'get_series_info', access_code: accessCode, series_id: seriesId });
}

export async function getVodInfo(accessCode: string, vodId: number): Promise<any> {
  return callProxy({ action: 'get_vod_info', access_code: accessCode, vod_id: vodId });
}

export interface EpgEntry {
  id: string;
  epg_id: string;
  title: string;
  lang: string;
  start: string;
  end: string;
  description: string;
  channel_id: string;
  start_timestamp: number;
  stop_timestamp: number;
  now_playing?: boolean;
  has_archive?: number;
}

export async function getShortEpg(accessCode: string, streamId: number, limit?: number): Promise<EpgEntry[]> {
  const data = await callProxy({ action: 'get_short_epg', access_code: accessCode, stream_id: streamId, limit: limit || 4 });
  return data?.epg_listings || [];
}

export async function getStreamUrl(accessCode: string, streamType: 'live' | 'movie' | 'series', streamId: number | string, extension?: string): Promise<string> {
  const data = await callProxy({
    action: 'get_stream_url',
    access_code: accessCode,
    stream_type: streamType,
    stream_id: streamId,
    extension,
  });
  return data.url;
}

export async function checkChannelsStatus(accessCode: string, streamIds: number[]): Promise<Record<number, boolean>> {
  const data = await callProxy({ action: 'check_channels', access_code: accessCode, stream_ids: streamIds });
  return data?.results || {};
}

export function getProxyStreamUrl(accessCode: string, streamType: 'live' | 'movie' | 'series', streamId: number | string, extension?: string): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'knrubxjvtgkypasndwkn';
  const params = new URLSearchParams({
    action: 'proxy_stream',
    access_code: accessCode,
    stream_type: streamType,
    stream_id: String(streamId),
  });
  if (extension) params.set('extension', extension);
  return `https://${projectId}.supabase.co/functions/v1/xtream-proxy?${params.toString()}`;
}
