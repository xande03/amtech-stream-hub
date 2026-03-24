import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { getSeriesInfo, getSeriesList, SeriesInfo, Series, Episode } from '@/services/xtreamApi';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import ContentCard from '@/components/ContentCard';
import ContentRow from '@/components/ContentRow';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Play, Heart, ArrowLeft, Star, CheckCircle2, RotateCcw, Download, Loader2, Youtube, X, Cast } from 'lucide-react';
import { SeriesDetailSkeleton } from '@/components/LoadingSkeleton';
import { backdropImage, posterImage, episodeThumbnail } from '@/lib/imageProxy';
import { useDownloads } from '@/hooks/useDownloads';
import { useChromecast } from '@/hooks/useChromecast';
import { getStreamUrl } from '@/services/xtreamApi';

function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  if (/^[\w-]{11}$/.test(input)) return input;
  const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([^\s&?#]+)/);
  return match?.[1] || null;
}

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessCode } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToHistory, history, getResumeTime } = useWatchHistory();
  const { startDownload, isDownloaded, getDownloadStatus } = useDownloads();
  const { castMedia } = useChromecast();
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (!accessCode || !id) return;
    setLoading(true);
    Promise.all([
      getSeriesInfo(accessCode, Number(id)),
      getSeriesList(accessCode),
    ]).then(([data, list]) => {
      setSeriesInfo(data);
      setAllSeries(list);
      const seasons = Object.keys(data.episodes || {}).sort((a, b) => Number(a) - Number(b));
      if (seasons.length > 0) setSelectedSeason(seasons[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [accessCode, id]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  };

  const getEpisodeProgress = (episodeId: string) => {
    const item = history.find(h => String(h.id) === String(episodeId) && h.type === 'series');
    return item?.progress || 0;
  };

  const getEpisodeResumeTime = (episodeId: string) => {
    return getResumeTime(episodeId, 'series');
  };

  const handlePlayEpisode = (episode: Episode) => {
    if (!seriesInfo) return;
    const seriesCover = seriesInfo.info.cover || seriesInfo.info.backdrop_path?.[0] || '';
    addToHistory({ id: episode.id, type: 'series', name: seriesInfo.info.name, icon: seriesCover, episodeInfo: `S${episode.season}E${episode.episode_num}` });
    const ext = episode.container_extension || 'mp4';
    const params = new URLSearchParams({
      seriesId: String(seriesInfo.info.series_id),
      season: String(episode.season),
      ep: String(episode.episode_num),
      name: seriesInfo.info.name,
    });
    navigate(`/player/series/${episode.id}/${ext}?${params.toString()}`);
  };

  const similarSeries = useMemo(() => {
    if (!seriesInfo || allSeries.length === 0) return [];
    const si = seriesInfo.info;
    const genreStr = (si.genre || '').toLowerCase();
    const genres = genreStr.split(',').map((g: string) => g.trim()).filter(Boolean);

    return allSeries
      .filter(s => s.series_id !== si.series_id)
      .map(s => {
        let score = 0;
        if (s.category_id === si.category_id) score += 3;
        const sGenre = (s.genre || '').toLowerCase();
        genres.forEach(g => { if (sGenre.includes(g)) score += 2; });
        return { series: s, score };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(s => s.series);
  }, [seriesInfo, allSeries]);

  if (loading) return <SeriesDetailSkeleton />;
  if (!seriesInfo) return <div className="text-center py-12 text-muted-foreground">Série não encontrada.<br /><button onClick={() => navigate('/series')} className="text-primary mt-4 underline">Voltar</button></div>;

  const { info, episodes } = seriesInfo;
  const seasons = Object.keys(episodes || {}).sort((a, b) => Number(a) - Number(b));
  const currentEpisodes = episodes[selectedSeason] || [];

  const backdrop = info.backdrop_path?.[0] || '';
  const videoId = extractYouTubeId(info.youtube_trailer || '');

  return (
    <div className="pb-24">
      {/* Backdrop banner */}
      <div className="relative -mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-6 md:h-96 md:aspect-auto aspect-[3/4] overflow-hidden bg-black flex items-center justify-center">
        {showTrailer && videoId ? (
          <div className="absolute inset-0 z-20 bg-black flex items-center justify-center">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0 absolute inset-0"
            />
            <button onClick={() => setShowTrailer(false)} className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white z-30 transition-colors hover:bg-black/80">
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <img 
              src={backdrop ? backdropImage(backdrop) : posterImage(info.cover || '')} 
              alt="" 
              className="w-full h-full object-cover md:object-cover" 
              onError={(e) => { const img = e.target as HTMLImageElement; if (!img.dataset.retried) { img.dataset.retried = '1'; img.src = backdrop || info.cover || ''; return; } img.style.display = 'none'; }} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            
            <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white transition-colors z-20">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center md:items-start md:flex-row gap-6 mb-8 md:px-4">
        {/* Desktop Poster */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary shadow-lg">
            {info.cover ? <img src={posterImage(info.cover)} alt={info.name} className="w-full h-full object-cover" onError={(e) => { const img = e.target as HTMLImageElement; if (!img.dataset.retried) { img.dataset.retried = '1'; img.src = info.cover; } }} /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem capa</div>}
          </div>
        </div>

        <div className="flex-1 w-full space-y-5 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black text-foreground uppercase tracking-wide">{info.name}</h1>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm font-medium text-muted-foreground">
            {info.rating && <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full"><Star className="w-4 h-4 fill-primary text-primary" /> {info.rating}</span>}
            {info.releaseDate && <span className="px-3 py-1 rounded-full bg-secondary/50">{info.releaseDate.split('-')[0]}</span>}
          </div>

          {info.genre && (
            <div className="font-medium text-foreground text-sm overflow-hidden text-ellipsis whitespace-nowrap px-4 md:px-0">
              {info.genre.split(',').map(g => g.trim()).join(', ')}
            </div>
          )}

          <div className="pt-2 px-4 md:px-0 flex flex-col gap-4">
            <Button 
              onClick={() => {
                const firstUnwatched = currentEpisodes.find(ep => getEpisodeProgress(ep.id) < 90) || currentEpisodes[0];
                if (firstUnwatched) handlePlayEpisode(firstUnwatched);
              }} 
              className="w-full py-6 text-base rounded-full bg-white hover:bg-white/90 text-black font-bold shadow-lg"
            >
              <Play className="w-5 h-5 mr-3 fill-black text-black" /> Reproduzir série
            </Button>

            <div className="flex items-center justify-start gap-2 py-2 w-full overflow-x-auto no-scrollbar pl-1 pr-4 md:pl-0">
              <button 
                onClick={() => toggleFavorite({ id: info.series_id, type: 'series', name: info.name, icon: info.cover })} 
                className={`flex-shrink-0 p-3.5 md:p-4 rounded-full border border-border bg-background transition-colors hover:bg-secondary flex items-center justify-center ${isFavorite(info.series_id, 'series') ? 'border-primary/50' : ''}`}
              >
                <Heart className={`w-5 h-5 ${isFavorite(info.series_id, 'series') ? 'fill-primary text-primary' : 'text-foreground'}`} />
              </button>

              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!accessCode || !seriesInfo || currentEpisodes.length === 0) return;
                  const firstUnwatched = currentEpisodes.find(ep => getEpisodeProgress(ep.id) < 90) || currentEpisodes[0];
                  if (!firstUnwatched) return;
                  const epInfo = `S${firstUnwatched.season}E${firstUnwatched.episode_num}`;
                  if (isDownloaded(firstUnwatched.id, 'series', epInfo)) return;
                  try {
                    const ext = firstUnwatched.container_extension || 'mp4';
                    const url = await getStreamUrl(accessCode, 'series', firstUnwatched.id, ext);
                    startDownload({
                      id: firstUnwatched.id,
                      type: 'series',
                      name: seriesInfo.info.name,
                      icon: seriesInfo.info.cover || '',
                      url,
                      episodeInfo: epInfo,
                      episodeTitle: firstUnwatched.title,
                      seriesId: seriesInfo.info.series_id,
                    });
                  } catch { /* ignore */ }
                }}
                className="flex-shrink-0 p-3.5 md:p-4 rounded-full border border-border bg-background transition-colors hover:bg-secondary flex items-center justify-center"
              >
                <Download className="w-5 h-5 text-foreground" />
              </button>

              {info.youtube_trailer && videoId && (
                <Button variant="outline" onClick={() => { setShowTrailer(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex-shrink-0 rounded-full px-5 py-5 border-border text-foreground hover:bg-secondary font-medium h-auto">
                  <Youtube className="w-5 h-5 mr-2 text-destructive" />
                  Trailer
                </Button>
              )}
              
              <Button 
                variant="outline"
                onClick={async () => {
                  if (!accessCode || !seriesInfo || currentEpisodes.length === 0) return;
                  const firstUnwatched = currentEpisodes.find(ep => getEpisodeProgress(ep.id) < 90) || currentEpisodes[0];
                  if (!firstUnwatched) return;
                  try {
                    const ext = firstUnwatched.container_extension || 'mp4';
                    const url = await getStreamUrl(accessCode, 'series', firstUnwatched.id, ext);
                    castMedia(url, `${seriesInfo.info.name} - S${firstUnwatched.season}E${firstUnwatched.episode_num}`, seriesInfo.info.cover || '');
                  } catch (e) { console.error('Error starting cast', e); }
                }}
                className="flex-shrink-0 rounded-full px-5 py-5 border-border text-foreground hover:bg-secondary font-medium h-auto"
              >
                <Cast className="w-5 h-5 mr-2" />
                Chromecast
              </Button>
            </div>
          </div>

          <div className="px-4 md:px-0 text-left space-y-3 mt-4">
            {info.plot && <p className="text-muted-foreground text-sm/relaxed select-text">{info.plot}</p>}
            {info.cast && <p className="text-sm text-muted-foreground mt-4"><span className="text-foreground font-semibold">Elenco:</span> {info.cast}</p>}
            {info.director && <p className="text-sm text-muted-foreground"><span className="text-foreground font-semibold">Diretor:</span> {info.director}</p>}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {seasons.map(s => (
              <button key={s} onClick={() => setSelectedSeason(s)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedSeason === s ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                Temporada {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {currentEpisodes.map((ep, index) => {
            const progress = getEpisodeProgress(ep.id);
            const isWatched = progress > 90;
            const durationText = ep.info?.duration || '';

            return (
              <motion.div key={ep.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="rounded-lg bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer group overflow-hidden"
                onClick={() => handlePlayEpisode(ep)}>
                <div className="flex items-start gap-4 p-3">
                  {/* Episode number */}
                  <span className="text-lg font-medium text-muted-foreground mt-2 w-6 text-center flex-shrink-0">{index + 1}</span>
                  
                  {/* Thumbnail with progress bar overlay */}
                  <div className="w-28 flex-shrink-0">
                    <div className="aspect-video rounded-md overflow-hidden bg-secondary relative">
                      {ep.info?.movie_image ? (
                        <img src={episodeThumbnail(ep.info.movie_image)} alt={ep.title} className="w-full h-full object-cover" onError={(e) => { const img = e.target as HTMLImageElement; if (!img.dataset.retried) { img.dataset.retried = '1'; img.src = ep.info.movie_image!; } }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      )}
                      {isWatched && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      {/* Progress bar at bottom of thumbnail */}
                      {progress > 0 && progress <= 90 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary/80">
                          <div className="h-full bg-destructive rounded-r-full" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${isWatched ? 'text-muted-foreground' : 'text-foreground'}`}>{ep.title || `Episódio ${ep.episode_num}`}</p>
                      {durationText && <span className="text-xs text-muted-foreground flex-shrink-0">{durationText}</span>}
                    </div>
                    {(() => {
                      const epResume = getEpisodeResumeTime(ep.id);
                      if (epResume > 0 && !isWatched) {
                        return <p className="text-xs text-primary flex items-center gap-1 mt-0.5"><RotateCcw className="w-3 h-3" /> Retomar de {formatTime(epResume)}</p>;
                      }
                      return null;
                    })()}
                    {ep.info?.plot && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{ep.info.plot}</p>}
                  </div>

                  {/* Download button */}
                  <button
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 self-center"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!accessCode || !seriesInfo) return;
                      const epInfo = `S${ep.season}E${ep.episode_num}`;
                      if (isDownloaded(ep.id, 'series', epInfo)) return;
                      try {
                        const ext = ep.container_extension || 'mp4';
                        const url = await getStreamUrl(accessCode, 'series', ep.id, ext);
                        startDownload({
                          id: ep.id,
                          type: 'series',
                          name: seriesInfo.info.name,
                          icon: seriesInfo.info.cover || '',
                          url,
                          episodeInfo: epInfo,
                          episodeTitle: ep.title,
                          seriesId: seriesInfo.info.series_id,
                        });
                      } catch { /* ignore */ }
                    }}
                  >
                    {(() => {
                      const epInfo = `S${ep.season}E${ep.episode_num}`;
                      const dl = getDownloadStatus(ep.id, 'series', epInfo);
                      if (dl?.status === 'completed') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
                      if (dl?.status === 'downloading') return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
                      return <Download className="w-5 h-5" />;
                    })()}
                  </button>

                  {/* Cast button for individual episode */}
                  <button
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 self-center hidden sm:block"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!accessCode || !seriesInfo) return;
                      try {
                        const ext = ep.container_extension || 'mp4';
                        const url = await getStreamUrl(accessCode, 'series', ep.id, ext);
                        castMedia(url, `${seriesInfo.info.name} - S${ep.season}E${ep.episode_num}`, seriesInfo.info.cover || '');
                      } catch (err) { console.error('Cast error:', err); }
                    }}
                    title="Espelhar episódio"
                  >
                    <Cast className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
        {currentEpisodes.length === 0 && <div className="text-center py-8 text-muted-foreground">Nenhum episódio encontrado nesta temporada.</div>}
      </motion.div>

      {similarSeries.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10">
          <ContentRow title="Títulos Semelhantes">
            {similarSeries.map(s => (
              <div key={s.series_id} className="w-32 md:w-40 flex-shrink-0">
                <ContentCard
                  title={s.name}
                  image={s.cover}
                  rating={s.rating}
                  onClick={() => navigate(`/series/${s.series_id}`)}
                />
              </div>
            ))}
          </ContentRow>
        </motion.div>
      )}
    </div>
  );
}
