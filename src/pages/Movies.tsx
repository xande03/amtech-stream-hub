import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getVodStreams, getVodCategories, VodStream, Category } from '@/services/xtreamApi';
import ContentCard from '@/components/ContentCard';
import ContentRow from '@/components/ContentRow';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const PAGE_SIZE = 60;

export default function Movies() {
  const { accessCode } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [movies, setMovies] = useState<VodStream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!accessCode) return;
    setLoading(true);
    Promise.all([
      getVodStreams(accessCode).catch(() => []),
      getVodCategories(accessCode).catch(() => []),
    ]).then(([m, c]) => { setMovies(m); setCategories(c); }).finally(() => setLoading(false));
  }, [accessCode]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedCategory, search]);

  const filtered = useMemo(() => {
    let result = movies;
    if (selectedCategory !== 'all') result = result.filter(m => m.category_id === selectedCategory);
    if (search) { const q = search.toLowerCase(); result = result.filter(m => m.name.toLowerCase().includes(q)); }
    return result;
  }, [movies, selectedCategory, search]);

  const visible = filtered.slice(0, visibleCount);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-4">Filmes</h1>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar filmes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary border-border text-foreground" />
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>Todos</button>
          {categories.map(cat => (
            <button key={cat.category_id} onClick={() => setSelectedCategory(cat.category_id)} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${selectedCategory === cat.category_id ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{cat.category_name}</button>
          ))}
        </div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
        {visible.map((m) => (
          <ContentCard key={m.stream_id} title={m.name} image={m.stream_icon} rating={m.rating} subtitle={m.genre}
            isFavorite={isFavorite(m.stream_id, 'movie')}
            onFavoriteToggle={() => toggleFavorite({ id: m.stream_id, type: 'movie', name: m.name, icon: m.stream_icon })}
            onClick={() => navigate(`/movies/${m.stream_id}`)} />
        ))}
      </motion.div>
      {visibleCount < filtered.length && (
        <div className="flex justify-center mt-6">
          <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
            Carregar mais ({filtered.length - visibleCount} restantes)
          </button>
        </div>
      )}
      {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">Nenhum filme encontrado.</div>}
    </div>
  );
}
