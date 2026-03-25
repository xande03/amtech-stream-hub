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
  if (typeof credentials === 'object' && credentials?.server_url) {
    const { server_url, username, password } = credentials;
    const baseUrl = server_url.replace(/\/$/, '');
    const url = new URL(`${baseUrl}/player_api.php`);
    
    url.searchParams.set('username', username);
    url.searchParams.set('password', password);
    
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
      'check_channels': 'get_live_streams'
    };

    const action = actionMap[params.action] || params.action;
    if (action) url.searchParams.set('action', action);
    
    for (const [key, value] of Object.entries(params)) {
      if (key === 'action') continue;
      url.searchParams.set(key, String(value));
    }

    try {
      const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn('Direct fetch failed, falling back to proxy:', err);
      const { data, error } = await supabase.functions.invoke('xtream-proxy', {
        body: { 
          ...params, 
          server_url: credentials.server_url,
          username: credentials.username,
          password: credentials.password
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    }
  }

  // Fallback para código de acesso string
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

export async function getLiveCategories(creds: string | StreamUrlInfo) {
  return callApi(creds, { action: 'get_live_categories' });
}

export async function getLiveStreams(creds: string | StreamUrlInfo, categoryId?: string) {
  return callApi(creds, { action: 'get_live_streams', category_id: categoryId });
}

export async function getVodCategories(creds: string | StreamUrlInfo) {
  return callApi(creds, { action: 'get_vod_categories' });
}

export async function getVodStreams(creds: string | StreamUrlInfo, categoryId?: string) {
  return callApi(creds, { action: 'get_vod_streams', category_id: categoryId });
}

export async function getSeriesCategories(creds: string | StreamUrlInfo) {
  return callApi(creds, { action: 'get_series_categories' });
}

export async function getSeriesList(creds: string | StreamUrlInfo, categoryId?: string) {
  return callApi(creds, { action: 'get_series', category_id: categoryId });
}

export async function getSeriesInfo(creds: string | StreamUrlInfo, seriesId: number) {
  return callApi(creds, { action: 'get_series_info', series_id: seriesId });
}

export async function getVodInfo(creds: string | StreamUrlInfo, vodId: number) {
  return callApi(creds, { action: 'get_vod_info', vod_id: vodId });
}

export async function getShortEpg(creds: string | StreamUrlInfo, streamId: number) {
  const data = await callApi(creds, { action: 'get_short_epg', stream_id: streamId });
  return data?.epg_listings || [];
}

export async function getAllEpg(creds: string | StreamUrlInfo, streamId: number) {
  return callApi(creds, { action: 'get_all_epg', stream_id: streamId });
}

export async function getStreamUrl(creds: string | StreamUrlInfo, type: 'live' | 'movie' | 'series', id: string | number, extension?: string) {
  const data = await callApi(creds, { action: 'get_stream_url', stream_type: type, stream_id: id, extension });
  return data?.url;
}

export async function checkChannelsStatus(creds: string | StreamUrlInfo, streamIds: number[]) {
  const data = await callApi(creds, { action: 'check_channels', stream_ids: streamIds });
  return data?.results || {};
}
