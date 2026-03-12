import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, X, Film, Clapperboard, Tv, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getVodStreams, getSeriesList, getLiveStreams, VodStream, Series, LiveStream } from '@/services/xtreamApi';
import { motion, AnimatePresence } from 'framer-motion';
import { useWatchHistory } from '@/hooks/useWatchHistory';

type ResultItem = {
  id: number;
  name: string;
  image: string;
  type: 'movie' | 'series' | 'live';
  genre?: string;
};

export default function GlobalSearch() {
  const { accessCode } = useAuth();
  const navigate = useNavigate();
  const { addToHistory } = useWatchHistory();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<VodStream[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load data on first open
  useEffect(() => {
    if (!open || loaded || !accessCode) return;
    setLoading(true);
    Promise.all([
      getVodStreams(accessCode).catch(() => []),
      getSeriesList(accessCode).catch(() => []),
      getLiveStreams(accessCode).catch(() => []),
    ]).then(([m, s, l]) => {
      setMovies(m);
      setSeries(s);
      setLiveStreams(l);
      setLoaded(true);
    }).finally(() => setLoading(false));
  }, [open, loaded, accessCode]);

  const results = useMemo((): ResultItem[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const movieResults: ResultItem[] = movies
      .filter(m => (m.name || '').toLowerCase().includes(q))
      .slice(0, 6)
      .map(m => ({ id: m.stream_id, name: m.name, image: m.stream_icon, type: 'movie', genre: m.genre }));
    const seriesResults: ResultItem[] = series
      .filter(s => (s.name || '').toLowerCase().includes(q))
      .slice(0, 6)
      .map(s => ({ id: s.series_id, name: s.name, image: s.cover, type: 'series', genre: s.genre }));
    const liveResults: ResultItem[] = liveStreams
      .filter(l => (l.name || '').toLowerCase().includes(q))
      .slice(0, 6)
      .map(l => ({ id: l.stream_id, name: l.name, image: l.stream_icon, type: 'live' }));
    return [...liveResults, ...movieResults, ...seriesResults].slice(0, 15);
  }, [query, movies, series, liveStreams]);

  const handleSelect = useCallback((item: ResultItem) => {
    setOpen(false);
    setQuery('');
    if (item.type === 'live') {
      addToHistory({ id: item.id, type: 'live', name: item.name, icon: item.image });
      window.open(`/player/live/${item.id}`, '_blank');
    } else if (item.type === 'movie') {
      navigate(`/movies/${item.id}`);
    } else {
      navigate(`/series/${item.id}`);
    }
  }, [navigate, addToHistory]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const typeLabel = (type: string) => {
    if (type === 'movie') return 'Filme';
    if (type === 'series') return 'Série';
    return 'Canal';
  };

  const TypeIcon = ({ type }: { type: string }) => {
    if (type === 'movie') return <Film className="w-5 h-5 text-muted-foreground" />;
    if (type === 'series') return <Clapperboard className="w-5 h-5 text-muted-foreground" />;
    return <Tv className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2.5 rounded-full bg-secondary/80 backdrop-blur-md border border-border/50 shadow-lg hover:bg-secondary transition-colors"
        aria-label="Buscar"
      >
        <Search className="w-5 h-5 text-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed top-4 left-3 right-3 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-[60]"
            >
              <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar filmes, séries e canais..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="flex-1 bg-transparent text-foreground text-base outline-none placeholder:text-muted-foreground"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="p-1 rounded-full hover:bg-muted transition-colors">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                  )}

                  {!loading && query.trim() && results.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-8">Nenhum resultado encontrado</p>
                  )}

                  {!loading && results.length > 0 && (
                    <div className="py-2">
                      {results.map((item) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          onClick={() => handleSelect(item)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt=""
                              className={`${item.type === 'live' ? 'w-10 h-10 rounded-lg' : 'w-10 h-14 rounded-lg'} object-cover bg-muted flex-shrink-0`}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className={`${item.type === 'live' ? 'w-10 h-10' : 'w-10 h-14'} rounded-lg bg-muted flex items-center justify-center flex-shrink-0`}>
                              <TypeIcon type={item.type} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                            <span className="text-[10px] font-bold uppercase text-primary">
                              {typeLabel(item.type)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {!loading && !query.trim() && (
                    <p className="text-center text-muted-foreground text-sm py-8">Digite para buscar filmes, séries e canais</p>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
