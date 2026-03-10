import { useNavigate } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import ContentCard from '@/components/ContentCard';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavorites();

  const liveChannels = favorites.filter(f => f.type === 'live');
  const movies = favorites.filter(f => f.type === 'movie');
  const series = favorites.filter(f => f.type === 'series');

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Heart className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Sem favoritos</h2>
        <p className="text-muted-foreground">Adicione canais, filmes ou séries aos favoritos.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-2xl font-bold text-foreground mb-6">Favoritos</h1>

      {liveChannels.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Canais</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {liveChannels.map(f => (
              <ContentCard
                key={f.id}
                title={f.name}
                image={f.icon}
                aspectRatio="square"
                isFavorite
                onFavoriteToggle={() => toggleFavorite(f)}
                onClick={() => navigate(`/player/live/${f.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {movies.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Filmes</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {movies.map(f => (
              <ContentCard
                key={f.id}
                title={f.name}
                image={f.icon}
                isFavorite
                onFavoriteToggle={() => toggleFavorite(f)}
                onClick={() => navigate(`/movies/${f.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {series.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Séries</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {series.map(f => (
              <ContentCard
                key={f.id}
                title={f.name}
                image={f.icon}
                isFavorite
                onFavoriteToggle={() => toggleFavorite(f)}
                onClick={() => navigate(`/series/${f.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
