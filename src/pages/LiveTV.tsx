import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getLiveStreams, getLiveCategories, LiveStream, Category } from '@/services/xtreamApi';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { Input } from '@/components/ui/input';
import { Search, Tv, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { LiveTVSkeleton } from '@/components/LoadingSkeleton';

const PAGE_SIZE = 60;

export default function LiveTV() {
  const { accessCode } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToHistory } = useWatchHistory();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!accessCode) return;
    setLoading(true);
    Promise.all([
      getLiveStreams(accessCode).catch(() => []),
      getLiveCategories(accessCode).catch(() => []),
    ]).then(([s, c]) => {
      setStreams(s);
      setCategories(c);
    }).finally(() => setLoading(false));
  }, [accessCode]);

  // Reset visible count when filter changes
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedCategory, search]);

  const filtered = useMemo(() => {
    let result = streams;
    if (selectedCategory !== 'all') result = result.filter(s => s.category_id === selectedCategory);
    if (search) { const q = search.toLowerCase(); result = result.filter(s => s.name.toLowerCase().includes(q)); }
    return result;
  }, [streams, selectedCategory, search]);

  const visible = filtered.slice(0, visibleCount);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">TV ao Vivo</h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          <button onClick={() => setViewMode('grid')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Grid</button>
          <button onClick={() => setViewMode('list')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Lista</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar canais..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary border-border text-foreground" />
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>Todos</button>
          {categories.map(cat => (
            <button key={cat.category_id} onClick={() => setSelectedCategory(cat.category_id)} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${selectedCategory === cat.category_id ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{cat.category_name}</button>
          ))}
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {visible.map((ch, i) => (
            <motion.div key={ch.stream_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}
              onClick={() => { addToHistory({ id: ch.stream_id, type: 'live', name: ch.name, icon: ch.stream_icon }); window.open(`/player/live/${ch.stream_id}`, '_blank'); }}
              className="group cursor-pointer bg-card rounded-lg p-3 border border-border hover:border-primary/50 hover:shadow-glow transition-all relative">
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite({ id: ch.stream_id, type: 'live', name: ch.name, icon: ch.stream_icon }); }}
                className="absolute top-2 right-2 z-10 p-1 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite(ch.stream_id, 'live') ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
              </button>
              <div className="w-full aspect-square rounded-md overflow-hidden bg-secondary mb-2 flex items-center justify-center">
                {ch.stream_icon ? (
                  <img src={ch.stream_icon} alt={ch.name} className="w-full h-full object-contain p-2" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (<Tv className="w-8 h-8 text-muted-foreground" />)}
              </div>
              <p className="text-sm text-foreground font-medium truncate">{ch.name}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((ch, i) => (
            <motion.div key={ch.stream_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.015, 0.4) }}
              onClick={() => { addToHistory({ id: ch.stream_id, type: 'live', name: ch.name, icon: ch.stream_icon }); window.open(`/player/live/${ch.stream_id}`, '_blank'); }}
              className="group cursor-pointer bg-card rounded-lg p-3 border border-border hover:border-primary/50 hover:shadow-glow transition-all flex items-center gap-3">
              <div className="w-12 h-12 rounded-md overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                {ch.stream_icon ? (
                  <img src={ch.stream_icon} alt={ch.name} className="w-full h-full object-contain p-1" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (<Tv className="w-5 h-5 text-muted-foreground" />)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium truncate">{ch.name}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite({ id: ch.stream_id, type: 'live', name: ch.name, icon: ch.stream_icon }); }}
                className="p-1.5 rounded-full hover:bg-secondary transition-colors"
              >
                <Heart className={`w-4 h-4 ${isFavorite(ch.stream_id, 'live') ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {visibleCount < filtered.length && (
        <div className="flex justify-center mt-6">
          <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
            Carregar mais ({filtered.length - visibleCount} restantes)
          </button>
        </div>
      )}

      {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">Nenhum canal encontrado.</div>}
    </div>
  );
}
