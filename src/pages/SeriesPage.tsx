import { useState, useEffect, useMemo } from 'react';

const SEVEN_DAYS_AGO = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
function isRecentlyAdded(added?: string | number): boolean {
  if (!added) return false;
  const ts = Number(added);
  if (!isNaN(ts) && ts > SEVEN_DAYS_AGO) return true;
  const d = new Date(added).getTime() / 1000;
  return !isNaN(d) && d > SEVEN_DAYS_AGO;
}
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSeriesList, getSeriesCategories, Series as SeriesType, Category } from '@/services/xtreamApi';
import ContentCard from '@/components/ContentCard';
import ContentRow from '@/components/ContentRow';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import DraggableScroll from '@/components/DraggableScroll';
import { SeriesLoadingSkeleton } from '@/components/LoadingSkeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, Filter } from 'lucide-react';

const PAGE_SIZE = 60;

export default function SeriesPage() {
  const { accessCode } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { history } = useWatchHistory();
  const [series, setSeries] = useState<SeriesType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!accessCode) return;
    setLoading(true);
    Promise.all([
      getSeriesList(accessCode).catch(() => []),
      getSeriesCategories(accessCode).catch(() => []),
    ]).then(([s, c]) => { 
      // Sort series by 'last_modified' (or added date/relevance)
      const sortedSeries = [...s].sort((a, b) => {
        const dateA = Number(a.last_modified) || 0;
        const dateB = Number(b.last_modified) || 0;
        return dateB - dateA;
      });
      setSeries(sortedSeries); 
      setCategories(c); 
    }).finally(() => setLoading(false));
  }, [accessCode]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedCategory, search]);

  const filtered = useMemo(() => {
    let result = series;
    if (selectedCategory !== 'all') result = result.filter(s => s.category_id === selectedCategory);
    if (search) { const q = search.toLowerCase(); result = result.filter(s => (s.name || '').toLowerCase().includes(q)); }
    return result;
  }, [series, selectedCategory, search]);

  const visible = filtered.slice(0, visibleCount);

  if (loading) return <SeriesLoadingSkeleton />;

  const recentlyWatched = history.filter(h => h.type === 'series').slice(0, 15);

  const platformKeywords = ['Netflix', 'Amazon', 'Disney', 'HBO', 'Apple', 'Paramount', 'Globoplay', 'Star+', 'Crunchyroll'];
  const platformCategories = categories.filter(c => platformKeywords.some(p => c.category_name.toLowerCase().includes(p.toLowerCase())));
  const otherCategories = categories.filter(c => !platformKeywords.some(p => c.category_name.toLowerCase().includes(p.toLowerCase())));

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-4">Séries</h1>
      <div className="flex flex-col gap-4 mb-6">
        <div className="relative max-w-lg w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Buscar séries..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 h-12 text-base bg-secondary border-border text-foreground rounded-xl" />
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
                  subtitle={item.episodeInfo}
                  onClick={() => navigate(`/series/${item.id}`)}
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
        {visible.map((s) => (
          <ContentCard key={s.series_id} title={s.name} image={s.cover} rating={s.rating} subtitle={s.genre}
            isNew={isRecentlyAdded(s.last_modified)}
            isFavorite={isFavorite(s.series_id, 'series')}
            onFavoriteToggle={() => toggleFavorite({ id: s.series_id, type: 'series', name: s.name, icon: s.cover })}
            onClick={() => navigate(`/series/${s.series_id}`)} />
        ))}
      </motion.div>
      {visibleCount < filtered.length && (
        <div className="flex justify-center mt-6">
          <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
            Carregar mais ({filtered.length - visibleCount} restantes)
          </button>
        </div>
      )}
      {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">Nenhuma série encontrada.</div>}
    </div>
  );
}
