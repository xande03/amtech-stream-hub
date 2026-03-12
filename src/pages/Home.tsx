import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getLiveStreams, getVodStreams, getSeriesList, getVodCategories, getSeriesCategories, LiveStream, VodStream, Series, Category } from '@/services/xtreamApi';
import ContentCard from '@/components/ContentCard';
import ContentRow from '@/components/ContentRow';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Tv, Info, ChevronLeft, ChevronRight, X, Film, Clapperboard, Star, ExternalLink } from 'lucide-react';
import { PageLoadingSkeleton } from '@/components/LoadingSkeleton';
import { heroImage, featuredImage, backdropImage } from '@/lib/imageProxy';

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
  const { history, removeFromHistory } = useWatchHistory();
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [movies, setMovies] = useState<VodStream[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [movieCategories, setMovieCategories] = useState<Category[]>([]);
  const [seriesCategories, setSeriesCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (!accessCode) return;
    setLoading(true);
    Promise.all([
      getLiveStreams(accessCode).catch(() => []),
      getVodStreams(accessCode).catch(() => []),
      getSeriesList(accessCode).catch(() => []),
      getVodCategories(accessCode).catch(() => []),
      getSeriesCategories(accessCode).catch(() => []),
    ]).then(([live, vod, ser, vodCats, serCats]) => {
      setLiveStreams(live.slice(0, 20));
      setMovies(vod);
      setSeries(ser);
      setMovieCategories(vodCats);
      setSeriesCategories(serCats);
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

  // Featured highlights - deduplicated, recent + high-rated
  const featuredItems = useMemo(() => {
    const seen = new Set<string>();
    const items: Array<{
      id: number; name: string; image: string; backdrop?: string; rating: number;
      type: 'movie' | 'series'; genre?: string; plot?: string; trailer?: string;
      added: number;
    }> = [];

    // Normalize name for dedup
    const normalize = (n: string) => n.replace(/\s*\[.*?\]\s*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

    movies
      .filter(m => m.stream_icon)
      .forEach(m => {
        const key = normalize(m.name);
        if (seen.has(key)) return;
        seen.add(key);
        items.push({
          id: m.stream_id, name: m.name, image: m.stream_icon, rating: parseRating(m.rating),
          type: 'movie', genre: m.genre, plot: m.plot, added: Number(m.added || 0),
        });
      });

    series
      .filter(s => s.cover)
      .forEach(s => {
        const key = normalize(s.name);
        if (seen.has(key)) return;
        seen.add(key);
        items.push({
          id: s.series_id, name: s.name, image: s.cover,
          backdrop: s.backdrop_path?.[0], rating: parseRating(s.rating),
          type: 'series', genre: s.genre, plot: s.plot,
          trailer: s.youtube_trailer || undefined,
          added: new Date(s.last_modified || 0).getTime() / 1000,
        });
      });

    // Score = rating weight + recency weight
    return items
      .map(item => ({ ...item, score: item.rating * 2 + (item.added > SEVEN_DAYS_AGO ? 5 : 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [movies, series]);

  // Recent movies/series (non-top-rated, for variety)
  const recentMovies = useMemo(() => movies.slice(0, 20), [movies]);
  const recentSeries = useMemo(() => series.slice(0, 20), [series]);

  // Enrich history items with cover from series list if icon is missing
  const enrichedHistory = useMemo(() => {
    return history.map(h => {
      if (h.icon) return h;
      if (h.type === 'series') {
        const match = series.find(s => s.name === h.name);
        if (match?.cover) return { ...h, icon: match.cover };
        if (match?.backdrop_path?.[0]) return { ...h, icon: match.backdrop_path[0] };
      }
      if (h.type === 'movie') {
        const match = movies.find(m => m.name === h.name);
        if (match?.stream_icon) return { ...h, icon: match.stream_icon };
      }
      return h;
    });
  }, [history, series, movies]);

  const continueWatching = enrichedHistory.filter(h => h.progress && h.progress > 5 && h.progress < 95);
  const recentlyWatched = enrichedHistory.filter(h => !(h.progress && h.progress > 5 && h.progress < 95));

  if (loading) return <PageLoadingSkeleton />;

  const currentHero = heroItems[heroIndex];

  return (
    <div className="space-y-6">
      {/* 1. Hero Carousel */}
      {currentHero && (
        <div className="relative rounded-xl overflow-hidden h-56 md:h-80 lg:h-96">
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
                src={heroImage(currentHero.image)}
                alt={currentHero.name}
                className="w-full h-full object-cover"
                onError={(e) => { const img = e.target as HTMLImageElement; if (!img.dataset.retried) { img.dataset.retried = '1'; img.src = currentHero.image; return; } img.style.display = 'none'; }}
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
            <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 line-clamp-2">{currentHero.name}</h2>
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

      {/* 2. Continuar Assistindo */}
      {continueWatching.length > 0 && (
        <ContentRow title="▶️ Continuar Assistindo">
          {continueWatching.slice(0, 15).map((item) => (
            <div key={`cw-${item.type}-${item.id}`} className="w-36 md:w-44 flex-shrink-0 relative group/cw">
              <button
                onClick={(e) => { e.stopPropagation(); removeFromHistory(item.id, item.type); }}
                className="absolute top-1 right-1 z-10 p-1 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover/cw:opacity-100 transition-opacity"
                title="Remover"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <ContentCard
                title={item.name}
                image={item.icon}
                subtitle={item.episodeInfo}
                aspectRatio={item.type === 'live' ? 'square' : 'portrait'}
                onClick={() => {
                  if (item.type === 'live') {
                    window.open(`/player/live/${item.id}`, '_blank');
                  } else if (item.type === 'movie') {
                    const params = new URLSearchParams({ name: item.name, icon: item.icon || '' });
                    navigate(`/player/movie/${item.id}/mp4?${params.toString()}`);
                  } else if (item.type === 'series') {
                    // Parse episodeInfo like "S1E3" to build player URL
                    const match = item.episodeInfo?.match(/S(\d+)E(\d+)/i);
                    const params = new URLSearchParams({ name: item.name, icon: item.icon || '' });
                    if (match) {
                      params.set('season', match[1]);
                      params.set('ep', match[2]);
                    }
                    navigate(`/player/series/${item.id}?${params.toString()}`);
                  }
                }}
              />
              <div className="w-full h-1.5 bg-secondary rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.progress}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{Math.round(item.progress || 0)}% assistido</p>
            </div>
          ))}
        </ContentRow>
      )}

      {/* 3. Assistidos Recentemente */}
      {recentlyWatched.length > 0 && (
        <ContentRow title="🕐 Assistidos Recentemente" onViewAll={() => navigate('/history')}>
          {recentlyWatched.slice(0, 20).map((item) => (
            <div key={`rw-${item.type}-${item.id}`} className="w-36 md:w-44 flex-shrink-0 relative group/rw">
              <button
                onClick={(e) => { e.stopPropagation(); removeFromHistory(item.id, item.type); }}
                className="absolute top-1 right-1 z-10 p-1 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover/rw:opacity-100 transition-opacity"
                title="Remover"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <ContentCard
                title={item.name}
                image={item.icon}
                aspectRatio={item.type === 'live' ? 'square' : 'portrait'}
                onClick={() => {
                  if (item.type === 'live') window.open(`/player/live/${item.id}`, '_blank');
                  else if (item.type === 'movie') navigate(`/movies/${item.id}`);
                  else navigate(`/series/${item.id}`);
                }}
              />
            </div>
          ))}
        </ContentRow>
      )}

      {/* 4. Destaques */}
      {featuredItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">⭐ Destaques</h3>
          <ContentRow title=" ">
            {featuredItems.map((item) => (
              <motion.div
                key={`feat-${item.type}-${item.id}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-64 md:w-80 flex-shrink-0 rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer group"
                onClick={() => navigate(item.type === 'movie' ? `/movies/${item.id}` : `/series/${item.id}`)}
              >
                <div className="relative aspect-video overflow-hidden bg-secondary">
                  <img
                    src={featuredImage(item.backdrop || item.image)}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 brightness-110"
                    loading="lazy"
                    onError={(e) => { const img = e.target as HTMLImageElement; if (!img.dataset.retried) { img.dataset.retried = '1'; img.src = item.backdrop || item.image; return; } img.src = item.image; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h4 className="text-sm font-bold text-foreground truncate">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold uppercase text-primary px-1.5 py-0.5 rounded bg-primary/15">
                        {item.type === 'movie' ? 'Filme' : 'Série'}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-primary font-medium">
                        <Star className="w-3 h-3" /> {item.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                </div>
                {item.trailer && (
                  <div className="p-2.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); window.open(`https://www.youtube.com/watch?v=${item.trailer}`, '_blank'); }}
                      className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Trailer
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </ContentRow>
        </div>
      )}

      {/* 5. Filmes Recém Adicionados */}
      {topMovies.length > 0 && (
        <ContentRow title="🔥 Filmes Recém Adicionados" onViewAll={() => navigate('/movies')}>
          {topMovies.slice(0, 20).map((m) => (
            <div key={m.stream_id} className="w-40 md:w-48 flex-shrink-0">
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

      {/* 6. Séries Recém Adicionadas */}
      {topSeries.length > 0 && (
        <ContentRow title="🔥 Séries Recém Adicionadas" onViewAll={() => navigate('/series')}>
          {topSeries.slice(0, 20).map((s) => (
            <div key={s.series_id} className="w-40 md:w-48 flex-shrink-0">
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

      {/* 7. Categorias Populares */}
      {(() => {
        const popularCats = [
          ...movieCategories.slice(0, 6).map(c => ({ ...c, type: 'movie' as const, icon: Film })),
          ...seriesCategories.slice(0, 6).map(c => ({ ...c, type: 'series' as const, icon: Clapperboard })),
        ].slice(0, 10);
        if (popularCats.length === 0) return null;
        const colors = [
          'from-primary/30 to-primary/10',
          'from-accent/30 to-accent/10',
          'from-destructive/20 to-destructive/5',
          'from-primary/20 to-accent/10',
          'from-accent/20 to-primary/10',
        ];
        return (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">📂 Categorias Populares</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {popularCats.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <motion.button
                    key={`${cat.type}-${cat.category_id}`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(cat.type === 'movie' ? `/movies?category=${cat.category_id}` : `/series?category=${cat.category_id}`)}
                    className={`relative overflow-hidden rounded-xl p-4 text-left bg-gradient-to-br ${colors[i % colors.length]} border border-border/50 hover:border-primary/30 transition-colors`}
                  >
                    <Icon className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm font-medium text-foreground truncate">{cat.category_name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{cat.type === 'movie' ? 'Filmes' : 'Séries'}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 8. Filmes Recentes */}
      {recentMovies.length > 0 && (
        <ContentRow title="🎬 Filmes Recentes" onViewAll={() => navigate('/movies')}>
          {recentMovies.map((m) => (
            <div key={m.stream_id} className="w-40 md:w-48 flex-shrink-0">
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

      {/* 9. Séries Recentes */}
      {recentSeries.length > 0 && (
        <ContentRow title="📺 Séries Recentes" onViewAll={() => navigate('/series')}>
          {recentSeries.map((s) => (
            <div key={s.series_id} className="w-40 md:w-48 flex-shrink-0">
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
