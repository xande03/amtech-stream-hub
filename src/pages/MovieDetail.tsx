import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { getVodInfo, getVodStreams, VodStream } from '@/services/xtreamApi';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Play, Heart, ArrowLeft, Star, Clock, Calendar } from 'lucide-react';

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessCode } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToHistory } = useWatchHistory();
  const [movie, setMovie] = useState<VodStream | null>(null);
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessCode || !id) return;
    setLoading(true);
    Promise.all([
      getVodStreams(accessCode).then(movies => movies.find(m => m.stream_id === Number(id)) || null),
      getVodInfo(accessCode, Number(id)).catch(() => null),
    ]).then(([m, i]) => { setMovie(m); setInfo(i); }).finally(() => setLoading(false));
  }, [accessCode, id]);

  const handlePlay = () => {
    if (!movie) return;
    addToHistory({ id: movie.stream_id, type: 'movie', name: movie.name, icon: movie.stream_icon });
    navigate(`/player/movie/${movie.stream_id}/${movie.container_extension || 'mp4'}`);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!movie) return <div className="text-center py-12 text-muted-foreground">Filme não encontrado.<br /><button onClick={() => navigate('/movies')} className="text-primary mt-4 underline">Voltar</button></div>;

  const movieInfo = info?.info || movie;
  const plot = movieInfo?.plot || movie?.plot || '';
  const genre = movieInfo?.genre || movie?.genre || '';
  const duration = movieInfo?.duration || movie?.duration || '';
  const releaseDate = movieInfo?.releaseDate || movieInfo?.releasedate || movie?.releaseDate || '';
  const cast = movieInfo?.cast || movie?.cast || '';
  const director = movieInfo?.director || movie?.director || '';

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"><ArrowLeft className="w-4 h-4" /> Voltar</button>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
            {movie.stream_icon ? <img src={movie.stream_icon} alt={movie.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem capa</div>}
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{movie.name}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {movie.rating && <span className="flex items-center gap-1"><Star className="w-4 h-4 text-primary" /> {movie.rating}</span>}
            {duration && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {duration}</span>}
            {releaseDate && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {releaseDate}</span>}
          </div>
          {genre && <div className="flex flex-wrap gap-2">{genre.split(',').map((g: string) => <span key={g.trim()} className="px-2 py-1 rounded-full bg-secondary text-xs text-foreground">{g.trim()}</span>)}</div>}
          {plot && <p className="text-muted-foreground text-sm leading-relaxed">{plot}</p>}
          {cast && <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Elenco:</span> {cast}</p>}
          {director && <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Diretor:</span> {director}</p>}
          <div className="flex gap-3 pt-2">
            <Button onClick={handlePlay} className="gradient-primary text-primary-foreground font-medium px-8"><Play className="w-4 h-4 mr-2" /> Assistir</Button>
            <Button variant="outline" onClick={() => toggleFavorite({ id: movie.stream_id, type: 'movie', name: movie.name, icon: movie.stream_icon })} className="border-border text-foreground hover:bg-secondary">
              <Heart className={`w-4 h-4 mr-2 ${isFavorite(movie.stream_id, 'movie') ? 'fill-destructive text-destructive' : ''}`} />
              {isFavorite(movie.stream_id, 'movie') ? 'Favoritado' : 'Favoritar'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
