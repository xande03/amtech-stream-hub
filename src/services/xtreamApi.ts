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

async function callApi(credentials: string | StreamUrlInfo, params: Record<string, any>) {
  // If it's an object, we use direct fetch (sent-to-sent)
  if (typeof credentials === 'object' && credentials?.server_url) {
    const { server_url, username, password } = credentials;
    const baseUrl = server_url.replace(/\/$/, '');
    const url = new URL(`${baseUrl}/player_api.php`);
    
    url.searchParams.set('username', username);
    url.searchParams.set('password', password);
    
    // Map internal actions to Xtream API actions
    const actionMap: Record<string, string> = {
      'get_live_categories': 'get_live_categories',
      'get_live_streams': 'get_live_streams',
      'get_vod_categories': 'get_vod_categories',
      'get_vod_streams': 'get_vod_streams',
      'get_series_categories': 'get_series_categories',
      'get_series': 'get_series',
      'get_series_info': 'get_series_info',
      'get_vod_info': 'get_vod_info',
      'get_short_epg': 'get_short_epg',
      'check_channels': 'get_live_streams' // Xtream API doesn't have a direct 'check_channels' action, often 'get_live_streams' is used to check status.
    };

    const action = actionMap[params.action] || params.action;
    if (action) url.searchParams.set('action', action);
    
    // Add other params
    for (const [key, value] of Object.entries(params)) {
      if (key === 'action') continue;
      url.searchParams.set(key, String(value));
    }

    try {
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn('Direct fetch failed, falling back to proxy if possible:', err);
      // If direct fails (CORS?), we'll throw as per instruction.
      throw err;
    }
  }

  // Fallback to proxy (only if access code string is provided)
  const { data, error } = await supabase.functions.invoke('xtream-proxy', {
    body: { ...params, access_code: credentials },
  });
  if (error) throw new Error(error.message || 'Erro na requisição');
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function authenticateWithCode(accessCode: string) {
  return callApi(accessCode, { action: 'authenticate' });
}

export async function getLiveCategories(credentials: string | StreamUrlInfo): Promise<Category[]> {
  return callApi(credentials, { action: 'get_live_categories' });
}

export async function getLiveStreams(credentials: string | StreamUrlInfo, categoryId?: string): Promise<LiveStream[]> {
  return callApi(credentials, { action: 'get_live_streams', category_id: categoryId });
}

export async function getVodCategories(credentials: string | StreamUrlInfo): Promise<Category[]> {
  return callApi(credentials, { action: 'get_vod_categories' });
}

export async function getVodStreams(credentials: string | StreamUrlInfo, categoryId?: string): Promise<VodStream[]> {
  return callApi(credentials, { action: 'get_vod_streams', category_id: categoryId });
}

export async function getSeriesCategories(credentials: string | StreamUrlInfo): Promise<Category[]> {
  return callApi(credentials, { action: 'get_series_categories' });
}

export async function getSeriesList(credentials: string | StreamUrlInfo, categoryId?: string): Promise<Series[]> {
  return callApi(credentials, { action: 'get_series', category_id: categoryId });
}

export async function getSeriesInfo(credentials: string | StreamUrlInfo, seriesId: number): Promise<SeriesInfo> {
  return callApi(credentials, { action: 'get_series_info', series_id: seriesId });
}

export async function getVodInfo(credentials: string | StreamUrlInfo, vodId: number): Promise<any> {
  return callApi(credentials, { action: 'get_vod_info', vod_id: vodId });
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

export async function getShortEpg(credentials: string | StreamUrlInfo, streamId: number, limit?: number): Promise<EpgEntry[]> {
  const data = await callApi(credentials, { action: 'get_short_epg', stream_id: streamId, limit: limit || 4 });
  return data?.epg_listings || [];
}

export async function getStreamUrl(credentials: string | StreamUrlInfo, streamType: 'live' | 'movie' | 'series', streamId: number | string, extension?: string): Promise<string> {
  if (typeof credentials === 'object' && credentials?.server_url) {
    const { server_url, username, password } = credentials;
    const baseUrl = server_url.replace(/\/$/, '');
    const ext = extension || (streamType === 'live' ? 'ts' : 'mp4');
    
    // Direct stream URL: http://server:port/type/username/password/id.ext
    // For Xtream, it's usually:
    // Live: /live/user/pass/id.ts
    // Movie: /movie/user/pass/id.mp4
    // Series: /series/user/pass/id.mp4
    const typePath = streamType === 'series' ? 'series' : (streamType === 'movie' ? 'movie' : 'live');
    return `${baseUrl}/${typePath}/${username}/${password}/${streamId}.${ext}`;
  }

  const data = await callApi(credentials, {
    action: 'get_stream_url',
    stream_type: streamType,
    stream_id: streamId,
    extension,
  });
  return data.url;
}

export async function checkChannelsStatus(credentials: string | StreamUrlInfo, streamIds: number[]): Promise<Record<number, boolean>> {
  const data = await callApi(credentials, { action: 'check_channels', stream_ids: streamIds });
  return data?.results || {};
}

export function getProxyStreamUrl(credentials: string | StreamUrlInfo, streamType: 'live' | 'movie' | 'series', streamId: number | string, extension?: string): string {
  if (typeof credentials === 'object' && credentials?.server_url) {
    const { server_url, username, password } = credentials;
    const baseUrl = server_url.replace(/\/$/, '');
    const ext = extension || (streamType === 'live' ? 'ts' : 'mp4');
    const typePath = streamType === 'series' ? 'series' : (streamType === 'movie' ? 'movie' : 'live');
    return `${baseUrl}/${typePath}/${username}/${password}/${streamId}.${ext}`;
  }

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'knrubxjvtgkypasndwkn';
  const params = new URLSearchParams({
    action: 'proxy_stream',
    access_code: String(credentials),
    stream_type: streamType,
    stream_id: String(streamId),
  });
  if (extension) params.set('extension', extension);
  return `https://${projectId}.supabase.co/functions/v1/xtream-proxy?${params.toString()}`;
}
