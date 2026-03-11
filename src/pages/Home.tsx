import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getLiveStreams, getVodStreams, getSeriesList, getVodCategories, getSeriesCategories, LiveStream, VodStream, Series, Category } from '@/services/xtreamApi';
import ContentCard from '@/components/ContentCard';
import ContentRow from '@/components/ContentRow';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Tv, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageLoadingSkeleton } from '@/components/LoadingSkeleton';

function parseRating(r?: string | number): number {
  if (!r) return 0;
  const n = typeof r === 'string' ? parseFloat(r) : r;
  return isNaN(n) ? 0 : n;
}

const SEVEN_DAYS_AGO = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;

function isRecentlyAdded(added?: string | number): boolean {
  if (!added) return false;
  const ts = Number(added);
  return !isNaN(ts) && ts > SEVEN_DAYS_AGO;
}

export default function Home() {
  const { accessCode } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { history } = useWatchHistory();
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [movies, setMovies] = useState<VodStream[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (!accessCode) return;
    setLoading(true);
    Promise.all([
      getLiveStreams(accessCode).catch(() => []),
      getVodStreams(accessCode).catch(() => []),
      getSeriesList(accessCode).catch(() => []),
    ]).then(([live, vod, ser]) => {
      setLiveStreams(live.slice(0, 20));
      setMovies(vod);
      setSeries(ser);
    }).finally(() => setLoading(false));
  }, [accessCode]);

  // Most recently added movies & series (by 'added' timestamp desc)
  const topMovies = useMemo(() =>
    [...movies]
      .filter(m => m.stream_icon)
      .sort((a, b) => Number(b.added || 0) - Number(a.added || 0))
      .slice(0, 30),
    [movies]
  );

  const topSeries = useMemo(() =>
    [...series]
      .filter(s => s.cover)
      .sort((a, b) => {
        const aTime = new Date(b.last_modified || 0).getTime();
        const bTime = new Date(a.last_modified || 0).getTime();
        return aTime - bTime;
      })
      .slice(0, 30),
    [series]
  );

  // Combine newest movies and series for hero carousel
  const heroItems = useMemo(() => {
    const combined: Array<{ id: number; name: string; image: string; rating: string; type: 'movie' | 'series'; genre?: string; plot?: string; added: number }> = [];
    topMovies.slice(0, 5).forEach(m => combined.push({
      id: m.stream_id, name: m.name, image: m.stream_icon, rating: m.rating, type: 'movie', genre: m.genre, plot: m.plot, added: Number(m.added || 0),
    }));
    topSeries.slice(0, 5).forEach(s => combined.push({
      id: s.series_id, name: s.name, image: s.cover, rating: s.rating, type: 'series', genre: s.genre, plot: s.plot, added: new Date(s.last_modified || 0).getTime() / 1000,
    }));
    return combined.sort((a, b) => b.added - a.added).slice(0, 8);
  }, [topMovies, topSeries]);

  // Auto-rotate hero
  useEffect(() => {
    if (heroItems.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex(i => (i + 1) % heroItems.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroItems.length]);

  // Recent movies/series (non-top-rated, for variety)
  const recentMovies = useMemo(() => movies.slice(0, 20), [movies]);
  const recentSeries = useMemo(() => series.slice(0, 20), [series]);

  if (loading) return <PageLoadingSkeleton />;

  const currentHero = heroItems[heroIndex];

  return (
    <div className="space-y-2">
      {/* Hero Carousel */}
      {currentHero && (
        <div className="relative rounded-xl overflow-hidden h-56 md:h-80 lg:h-96 mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentHero.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <img
                src={currentHero.image}
                alt={currentHero.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 max-w-lg z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-semibold uppercase">
                {currentHero.type === 'movie' ? 'Filme' : 'Série'}
              </span>
              {currentHero.rating && (
                <span className="text-sm text-primary font-medium">★ {currentHero.rating}</span>
              )}
            </div>
            <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1 line-clamp-2">{currentHero.name}</h2>
            {currentHero.genre && (
              <p className="text-xs md:text-sm text-muted-foreground mb-1 line-clamp-1">{currentHero.genre}</p>
            )}
            {currentHero.plot && (
              <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2 hidden md:block">{currentHero.plot}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => navigate(currentHero.type === 'movie' ? `/movies/${currentHero.id}` : `/series/${currentHero.id}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                <Play className="w-4 h-4" /> Assistir
              </button>
              <button
                onClick={() => navigate(currentHero.type === 'movie' ? `/movies/${currentHero.id}` : `/series/${currentHero.id}`)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/80 text-foreground font-medium hover:bg-secondary transition-colors"
              >
                <Info className="w-4 h-4" /> Detalhes
              </button>
            </div>
          </div>

          {/* Hero navigation */}
          {heroItems.length > 1 && (
            <>
              <button
                onClick={() => setHeroIndex(i => (i - 1 + heroItems.length) % heroItems.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/40 backdrop-blur-sm hover:bg-background/60 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button
                onClick={() => setHeroIndex(i => (i + 1) % heroItems.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/40 backdrop-blur-sm hover:bg-background/60 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
              {/* Dots */}
              <div className="absolute bottom-3 right-4 z-10 flex gap-1.5">
                {heroItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === heroIndex ? 'bg-primary w-5' : 'bg-foreground/30'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Continue Watching - only items with partial progress */}
      {(() => {
        const continueWatching = history.filter(h => h.progress && h.progress > 5 && h.progress < 95);
        if (continueWatching.length === 0) return null;
        return (
          <ContentRow title="▶️ Continuar Assistindo">
            {continueWatching.slice(0, 15).map((item) => (
              <div key={`cw-${item.type}-${item.id}`} className="w-36 md:w-44 flex-shrink-0">
                <ContentCard
                  title={item.name}
                  image={item.icon}
                  subtitle={item.episodeInfo}
                  aspectRatio={item.type === 'live' ? 'square' : 'portrait'}
                  onClick={() => {
                    if (item.type === 'live') window.open(`/player/live/${item.id}`, '_blank');
                    else if (item.type === 'movie') navigate(`/movies/${item.id}`);
                    else navigate(`/series/${item.id}`);
                  }}
                />
                <div className="w-full h-1.5 bg-secondary rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{Math.round(item.progress || 0)}% assistido</p>
              </div>
            ))}
          </ContentRow>
        );
      })()}

      {/* Top Movies */}
      {topMovies.length > 0 && (
        <ContentRow title="🔥 Filmes Recém Adicionados" onViewAll={() => navigate('/movies')}>
          {topMovies.slice(0, 20).map((m) => (
            <div key={m.stream_id} className="w-32 md:w-40 flex-shrink-0">
              <ContentCard
                title={m.name}
                image={m.stream_icon}
                rating={m.rating}
                isNew={isRecentlyAdded(m.added)}
                isFavorite={isFavorite(m.stream_id, 'movie')}
                onFavoriteToggle={() => toggleFavorite({ id: m.stream_id, type: 'movie', name: m.name, icon: m.stream_icon })}
                onClick={() => navigate(`/movies/${m.stream_id}`)}
              />
            </div>
          ))}
        </ContentRow>
      )}

      {/* Top Series */}
      {topSeries.length > 0 && (
        <ContentRow title="🔥 Séries Recém Adicionadas" onViewAll={() => navigate('/series')}>
          {topSeries.slice(0, 20).map((s) => (
            <div key={s.series_id} className="w-32 md:w-40 flex-shrink-0">
              <ContentCard
                title={s.name}
                image={s.cover}
                rating={s.rating}
                isNew={isRecentlyAdded(s.last_modified)}
                isFavorite={isFavorite(s.series_id, 'series')}
                onFavoriteToggle={() => toggleFavorite({ id: s.series_id, type: 'series', name: s.name, icon: s.cover })}
                onClick={() => navigate(`/series/${s.series_id}`)}
              />
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

      {/* Recent Movies */}
      {recentMovies.length > 0 && (
        <ContentRow title="Filmes Recentes" onViewAll={() => navigate('/movies')}>
          {recentMovies.map((m) => (
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

      {/* Recent Series */}
      {recentSeries.length > 0 && (
        <ContentRow title="Séries Recentes" onViewAll={() => navigate('/series')}>
          {recentSeries.map((s) => (
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
