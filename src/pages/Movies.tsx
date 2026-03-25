import { useState, useEffect, useMemo } from 'react';

const SEVEN_DAYS_AGO = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
function isRecentlyAdded(added?: string | number): boolean {
  if (!added) return false;
  const ts = Number(added);
  return !isNaN(ts) && ts > SEVEN_DAYS_AGO;
}
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getVodStreams, getVodCategories, VodStream, Category } from '@/services/xtreamApi';
import ContentCard from '@/components/ContentCard';
import ContentRow from '@/components/ContentRow';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import DraggableScroll from '@/components/DraggableScroll';
import { MoviesLoadingSkeleton } from '@/components/LoadingSkeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, Filter } from 'lucide-react';

const PAGE_SIZE = 60;

export default function Movies() {
  const { serverInfo } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { history } = useWatchHistory();
  const [movies, setMovies] = useState<VodStream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!serverInfo) return;
    setLoading(true);
    Promise.all([
      getVodStreams(serverInfo).catch(() => []),
      getVodCategories(serverInfo).catch(() => []),
    ]).then(([m, c]) => { 
      // Sort movies by 'added' timestamp descending (Newest first)
      const sortedMovies = [...m].sort((a, b) => {
        const addedA = Number(a.added) || 0;
        const addedB = Number(b.added) || 0;
        return addedB - addedA;
      });
      setMovies(sortedMovies); 
      setCategories(c); 
    }).finally(() => setLoading(false));
  }, [serverInfo]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedCategory, search]);

  const filtered = useMemo(() => {
    let result = movies;
    if (selectedCategory !== 'all') result = result.filter(m => m.category_id === selectedCategory);
    if (search) { const q = search.toLowerCase(); result = result.filter(m => m.name.toLowerCase().includes(q)); }
    return result;
  }, [movies, selectedCategory, search]);

  const visible = filtered.slice(0, visibleCount);

  if (loading) return <MoviesLoadingSkeleton />;

  const recentlyWatched = history.filter(h => h.type === 'movie').slice(0, 15);

  // Extract streaming platform tags from category names
  const platformKeywords = ['Netflix', 'Amazon', 'Disney', 'HBO', 'Apple', 'Paramount', 'Globoplay', 'Star+', 'Crunchyroll'];
  const platformCategories = categories.filter(c => platformKeywords.some(p => c.category_name.toLowerCase().includes(p.toLowerCase())));
  const otherCategories = categories.filter(c => !platformKeywords.some(p => c.category_name.toLowerCase().includes(p.toLowerCase())));

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-4">Filmes</h1>
      <div className="flex flex-col gap-4 mb-6">
        <div className="relative max-w-lg w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Buscar filmes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 h-12 text-base bg-secondary border-border text-foreground rounded-xl" />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full h-12 bg-secondary border-border text-foreground rounded-xl px-4 focus:ring-primary/20">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="Selecione uma categoria" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-[400px]">
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
            {platformCategories.slice(0, 5).map(cat => (
              <button 
                key={cat.category_id} 
                onClick={() => setSelectedCategory(cat.category_id)} 
                className={`px-4 py-2.5 rounded-xl text-xs whitespace-nowrap transition-all border ${
                  selectedCategory === cat.category_id 
                    ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {recentlyWatched.length > 0 && selectedCategory === 'all' && !search && (
        <div className="mb-6">
          <ContentRow title="Vistos Recentemente">
            {recentlyWatched.map((item) => (
              <div key={`history-${item.id}`} className="w-32 md:w-40 flex-shrink-0">
                <ContentCard
                  title={item.name}
                  image={item.icon}
                  onClick={() => navigate(`/movies/${item.id}`)}
                />
                {item.progress !== undefined && item.progress > 0 && (
                  <div className="w-full h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </ContentRow>
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
        {visible.map((m) => (
          <ContentCard key={m.stream_id} title={m.name} image={m.stream_icon} rating={m.rating}
            isNew={isRecentlyAdded(m.added)}
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
