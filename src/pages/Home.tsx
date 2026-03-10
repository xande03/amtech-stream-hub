import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getLiveStreams, getVodStreams, getSeriesList, LiveStream, VodStream, Series } from '@/services/xtreamApi';
import ContentCard from '@/components/ContentCard';
import ContentRow from '@/components/ContentRow';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { motion } from 'framer-motion';
import { Play, Tv } from 'lucide-react';

export default function Home() {
  const { credentials } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { history } = useWatchHistory();
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [movies, setMovies] = useState<VodStream[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!credentials) return;
    setLoading(true);
    Promise.all([
      getLiveStreams(credentials).catch(() => []),
      getVodStreams(credentials).catch(() => []),
      getSeriesList(credentials).catch(() => []),
    ]).then(([live, vod, ser]) => {
      setLiveStreams(live.slice(0, 20));
      setMovies(vod.slice(0, 20));
      setSeries(ser.slice(0, 20));
    }).finally(() => setLoading(false));
  }, [credentials]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const featuredMovie = movies[0];

  return (
    <div className="space-y-2">
      {/* Hero Banner */}
      {featuredMovie && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative rounded-xl overflow-hidden h-48 md:h-72 mb-6"
        >
          <img
            src={featuredMovie.stream_icon}
            alt={featuredMovie.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 max-w-md">
            <h2 className="text-xl md:text-3xl font-bold text-foreground mb-1">{featuredMovie.name}</h2>
            {featuredMovie.rating && (
              <p className="text-sm text-muted-foreground mb-3">★ {featuredMovie.rating}</p>
            )}
            <button
              onClick={() => navigate(`/movies/${featuredMovie.stream_id}`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              <Play className="w-4 h-4" /> Assistir
            </button>
          </div>
        </motion.div>
      )}

      {/* Continue Watching */}
      {history.length > 0 && (
        <ContentRow title="Continuar Assistindo">
          {history.slice(0, 10).map((item) => (
            <div key={`${item.type}-${item.id}`} className="w-36 md:w-44 flex-shrink-0">
              <ContentCard
                title={item.name}
                image={item.icon}
                subtitle={item.episodeInfo}
                aspectRatio="landscape"
                onClick={() => {
                  if (item.type === 'live') navigate(`/player/live/${item.id}`);
                  else if (item.type === 'movie') navigate(`/player/movie/${item.id}`);
                }}
              />
              {item.progress !== undefined && item.progress > 0 && (
                <div className="w-full h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${item.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </ContentRow>
      )}

      {/* Live TV */}
      {liveStreams.length > 0 && (
        <ContentRow title="TV ao Vivo" onViewAll={() => navigate('/live')}>
          {liveStreams.map((ch) => (
            <div key={ch.stream_id} className="w-28 md:w-36 flex-shrink-0">
              <ContentCard
                title={ch.name}
                image={ch.stream_icon}
                aspectRatio="square"
                isFavorite={isFavorite(ch.stream_id, 'live')}
                onFavoriteToggle={() => toggleFavorite({ id: ch.stream_id, type: 'live', name: ch.name, icon: ch.stream_icon })}
                onClick={() => navigate(`/player/live/${ch.stream_id}`)}
              />
            </div>
          ))}
        </ContentRow>
      )}

      {/* Movies */}
      {movies.length > 0 && (
        <ContentRow title="Filmes Recentes" onViewAll={() => navigate('/movies')}>
          {movies.map((m) => (
            <div key={m.stream_id} className="w-32 md:w-40 flex-shrink-0">
              <ContentCard
                title={m.name}
                image={m.stream_icon}
                rating={m.rating}
                isFavorite={isFavorite(m.stream_id, 'movie')}
                onFavoriteToggle={() => toggleFavorite({ id: m.stream_id, type: 'movie', name: m.name, icon: m.stream_icon })}
                onClick={() => navigate(`/movies/${m.stream_id}`)}
              />
            </div>
          ))}
        </ContentRow>
      )}

      {/* Series */}
      {series.length > 0 && (
        <ContentRow title="Séries Recentes" onViewAll={() => navigate('/series')}>
          {series.map((s) => (
            <div key={s.series_id} className="w-32 md:w-40 flex-shrink-0">
              <ContentCard
                title={s.name}
                image={s.cover}
                rating={s.rating}
                isFavorite={isFavorite(s.series_id, 'series')}
                onFavoriteToggle={() => toggleFavorite({ id: s.series_id, type: 'series', name: s.name, icon: s.cover })}
                onClick={() => navigate(`/series/${s.series_id}`)}
              />
            </div>
          ))}
        </ContentRow>
      )}

      {liveStreams.length === 0 && movies.length === 0 && series.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Tv className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum conteúdo encontrado</h2>
          <p className="text-muted-foreground">O servidor não retornou nenhum conteúdo disponível.</p>
        </div>
      )}
    </div>
  );
}
