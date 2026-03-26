import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Film, Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { useFavorites } from '@/hooks/useFavorites';

interface Recommendation {
  name: string;
  type: 'movie' | 'series';
  year: number;
  reason: string;
}

export default function AIRecommendations({ onSearch }: { onSearch?: (name: string, type: string) => void }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { history } = useWatchHistory();
  const { favorites } = useFavorites();

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-recommendations', {
        body: {
          history: history.slice(0, 15).map(h => ({ name: h.name, type: h.type })),
          favorites: favorites.slice(0, 10).map(f => ({ name: f.name, type: f.type })),
        },
      });
      if (fnError) throw fnError;
      if (data?.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (e: unknown) {
      const err = e as Error;
      console.error('AI recommendations error:', err);
      setError('Não foi possível carregar recomendações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  if (error && recommendations.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Recomendado para Você
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchRecommendations}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading && recommendations.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card border border-border p-4 animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {recommendations.map((rec, i) => (
            <motion.div
              key={`${rec.name}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSearch?.(rec.name, rec.type)}
              className="rounded-xl bg-card border border-border hover:border-primary/30 p-4 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                {rec.type === 'movie' ? (
                  <Film className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : (
                  <Clapperboard className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
                <span className="text-[10px] font-bold uppercase text-primary">
                  {rec.type === 'movie' ? 'Filme' : 'Série'}
                </span>
                {rec.year > 0 && (
                  <span className="text-[10px] text-muted-foreground ml-auto">{rec.year}</span>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {rec.name}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-tight">
                {rec.reason}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
