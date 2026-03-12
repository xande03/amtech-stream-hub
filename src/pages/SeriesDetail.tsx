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
import { Play, Heart, ArrowLeft, Star, CheckCircle2, RotateCcw } from 'lucide-react';
import { SeriesDetailSkeleton } from '@/components/LoadingSkeleton';
import YouTubeTrailer from '@/components/YouTubeTrailer';

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessCode } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToHistory, history, getResumeTime } = useWatchHistory();
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [loading, setLoading] = useState(true);

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
    addToHistory({ id: episode.id, type: 'series', name: seriesInfo.info.name, icon: seriesInfo.info.cover, episodeInfo: `S${episode.season}E${episode.episode_num}` });
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

  return (
    <div>
      {/* Backdrop banner */}
      {backdrop && (
        <div className="relative -mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-6 h-48 md:h-72 overflow-hidden rounded-b-2xl">
          <img src={backdrop} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"><ArrowLeft className="w-4 h-4" /> Voltar</button>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-full md:w-56 flex-shrink-0">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
              {info.cover ? <img src={info.cover} alt={info.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem capa</div>}
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{info.name}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {info.rating && <span className="flex items-center gap-1"><Star className="w-4 h-4 text-primary" /> {info.rating}</span>}
              {info.releaseDate && <span>{info.releaseDate}</span>}
              {info.genre && <span>{info.genre}</span>}
            </div>
            {info.plot && <p className="text-muted-foreground text-sm leading-relaxed">{info.plot}</p>}
            {info.cast && <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Elenco:</span> {info.cast}</p>}
            {info.director && <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Diretor:</span> {info.director}</p>}
            <Button variant="outline" onClick={() => toggleFavorite({ id: info.series_id, type: 'series', name: info.name, icon: info.cover })} className="border-border text-foreground hover:bg-secondary">
              <Heart className={`w-4 h-4 mr-2 ${isFavorite(info.series_id, 'series') ? 'fill-destructive text-destructive' : ''}`} />
              {isFavorite(info.series_id, 'series') ? 'Favoritado' : 'Favoritar'}
            </Button>
            {info.youtube_trailer && <YouTubeTrailer trailer={info.youtube_trailer} />}
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
                        <img src={ep.info.movie_image} alt={ep.title} className="w-full h-full object-cover" />
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
