export interface XtreamCredentials {
  server: string;
  username: string;
  password: string;
  playlistName: string;
}

export interface UserInfo {
  username: string;
  password: string;
  status: string;
  exp_date: string;
  max_connections: string;
  active_cons: string;
  created_at: string;
}

export interface ServerInfo {
  url: string;
  port: string;
  server_protocol: string;
  timezone: string;
}

export interface AuthResponse {
  user_info: UserInfo;
  server_info: ServerInfo;
}

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

function buildBaseUrl(creds: XtreamCredentials): string {
  const server = creds.server.replace(/\/+$/, '');
  return `${server}/player_api.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}`;
}

export function buildStreamUrl(creds: XtreamCredentials, type: 'live' | 'movie' | 'series', streamId: number | string, extension?: string): string {
  const server = creds.server.replace(/\/+$/, '');
  const ext = extension || (type === 'live' ? 'm3u8' : 'mp4');
  const pathType = type === 'movie' ? 'movie' : type === 'series' ? 'series' : 'live';
  return `${server}/${pathType}/${encodeURIComponent(creds.username)}/${encodeURIComponent(creds.password)}/${streamId}.${ext}`;
}

export async function authenticate(creds: XtreamCredentials): Promise<AuthResponse> {
  const url = buildBaseUrl(creds);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha na autenticação');
  const data = await res.json();
  if (!data.user_info || data.user_info.auth === 0) {
    throw new Error('Credenciais inválidas');
  }
  return data;
}

export async function getLiveCategories(creds: XtreamCredentials): Promise<Category[]> {
  const res = await fetch(`${buildBaseUrl(creds)}&action=get_live_categories`);
  if (!res.ok) throw new Error('Erro ao carregar categorias');
  return res.json();
}

export async function getLiveStreams(creds: XtreamCredentials, categoryId?: string): Promise<LiveStream[]> {
  let url = `${buildBaseUrl(creds)}&action=get_live_streams`;
  if (categoryId) url += `&category_id=${categoryId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erro ao carregar canais');
  return res.json();
}

export async function getVodCategories(creds: XtreamCredentials): Promise<Category[]> {
  const res = await fetch(`${buildBaseUrl(creds)}&action=get_vod_categories`);
  if (!res.ok) throw new Error('Erro ao carregar categorias');
  return res.json();
}

export async function getVodStreams(creds: XtreamCredentials, categoryId?: string): Promise<VodStream[]> {
  let url = `${buildBaseUrl(creds)}&action=get_vod_streams`;
  if (categoryId) url += `&category_id=${categoryId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erro ao carregar filmes');
  return res.json();
}

export async function getSeriesCategories(creds: XtreamCredentials): Promise<Category[]> {
  const res = await fetch(`${buildBaseUrl(creds)}&action=get_series_categories`);
  if (!res.ok) throw new Error('Erro ao carregar categorias');
  return res.json();
}

export async function getSeriesList(creds: XtreamCredentials, categoryId?: string): Promise<Series[]> {
  let url = `${buildBaseUrl(creds)}&action=get_series`;
  if (categoryId) url += `&category_id=${categoryId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erro ao carregar séries');
  return res.json();
}

export async function getSeriesInfo(creds: XtreamCredentials, seriesId: number): Promise<SeriesInfo> {
  const res = await fetch(`${buildBaseUrl(creds)}&action=get_series_info&series_id=${seriesId}`);
  if (!res.ok) throw new Error('Erro ao carregar informações da série');
  return res.json();
}

export async function getVodInfo(creds: XtreamCredentials, vodId: number): Promise<any> {
  const res = await fetch(`${buildBaseUrl(creds)}&action=get_vod_info&vod_id=${vodId}`);
  if (!res.ok) throw new Error('Erro ao carregar informações do filme');
  return res.json();
}
