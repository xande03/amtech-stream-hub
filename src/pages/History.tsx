import { useNavigate } from 'react-router-dom';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import ContentCard from '@/components/ContentCard';
import { motion } from 'framer-motion';
import { Clock, Trash2 } from 'lucide-react';

export default function History() {
  const navigate = useNavigate();
  const { history, clearHistory, removeFromHistory } = useWatchHistory();

  const liveItems = history.filter(h => h.type === 'live');
  const movieItems = history.filter(h => h.type === 'movie');
  const seriesItems = history.filter(h => h.type === 'series');

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Clock className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Sem histórico</h2>
        <p className="text-muted-foreground">Os conteúdos que você assistir aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Histórico</h1>
        <button
          onClick={clearHistory}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Limpar
        </button>
      </div>

      {liveItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Canais</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {liveItems.map(item => (
              <div key={`${item.type}-${item.id}`}>
                <ContentCard
                  title={item.name}
                  image={item.icon}
                  aspectRatio="square"
                  onClick={() => window.open(`/player/live/${item.id}`, '_blank')}
                  onRemove={() => removeFromHistory(item.id, item.type)}
                />
                {item.progress !== undefined && item.progress > 0 && (
                  <div className="w-full h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {movieItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Filmes</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {movieItems.map(item => (
              <div key={`${item.type}-${item.id}`}>
                <ContentCard
                  title={item.name}
                  image={item.icon}
                  onClick={() => navigate(`/movies/${item.id}`)}
                  onRemove={() => removeFromHistory(item.id, item.type)}
                />
                {item.progress !== undefined && item.progress > 0 && (
                  <div className="w-full h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {seriesItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Séries</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {seriesItems.map(item => (
              <div key={`${item.type}-${item.id}`}>
                <ContentCard
                  title={item.name}
                  image={item.icon}
                  subtitle={item.episodeInfo}
                  onClick={() => navigate(`/series/${item.id}`)}
                  onRemove={() => removeFromHistory(item.id, item.type)}
                />
                {item.progress !== undefined && item.progress > 0 && (
                  <div className="w-full h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
