import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { getVodInfo, getVodStreams, VodStream } from '@/services/xtreamApi';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import ContentCard from '@/components/ContentCard';
import ContentRow from '@/components/ContentRow';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Play, Heart, ArrowLeft, Star, Clock, Calendar, RotateCcw, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { DetailSkeleton } from '@/components/LoadingSkeleton';
import YouTubeTrailer from '@/components/YouTubeTrailer';
import { backdropImage, posterImage } from '@/lib/imageProxy';
import { useDownloads } from '@/hooks/useDownloads';
import { getStreamUrl } from '@/services/xtreamApi';

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessCode } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToHistory, history, getResumeTime } = useWatchHistory();
  const { startDownload, isDownloaded, getDownloadStatus } = useDownloads();
  const [movie, setMovie] = useState<VodStream | null>(null);
  const [allMovies, setAllMovies] = useState<VodStream[]>([]);
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!accessCode || !id) return;
    setLoading(true);
    Promise.all([
      getVodStreams(accessCode).then(movies => {
        setAllMovies(movies);
        return movies.find(m => m.stream_id === Number(id)) || null;
      }),
      getVodInfo(accessCode, Number(id)).catch(() => null),
    ]).then(([m, i]) => { setMovie(m); setInfo(i); }).finally(() => setLoading(false));
  }, [accessCode, id]);

  const resumeTime = movie ? getResumeTime(movie.stream_id, 'movie') : 0;

  const handlePlay = () => {
    if (!movie) return;
    addToHistory({ id: movie.stream_id, type: 'movie', name: movie.name, icon: movie.stream_icon });
    const params = new URLSearchParams({ name: movie.name, icon: movie.stream_icon || '' });
    navigate(`/player/movie/${movie.stream_id}/${movie.container_extension || 'mp4'}?${params.toString()}`);
  };

  // Similar movies: same category or overlapping genres
  const similarMovies = useMemo(() => {
    if (!movie || allMovies.length === 0) return [];
    const movieInfo = info?.info || movie;
    const genreStr = (movieInfo?.genre || movie?.genre || '').toLowerCase();
    const genres = genreStr.split(',').map((g: string) => g.trim()).filter(Boolean);

    return allMovies
      .filter(m => m.stream_id !== movie.stream_id)
      .map(m => {
        let score = 0;
        // Same category
        if (m.category_id === movie.category_id) score += 3;
        // Overlapping genres
        const mGenre = (m.genre || '').toLowerCase();
        genres.forEach(g => { if (mGenre.includes(g)) score += 2; });
        return { movie: m, score };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(s => s.movie);
  }, [movie, allMovies, info]);

  if (loading) return <DetailSkeleton />;
  if (!movie) return <div className="text-center py-12 text-muted-foreground">Filme não encontrado.<br /><button onClick={() => navigate('/movies')} className="text-primary mt-4 underline">Voltar</button></div>;

  const movieInfo = info?.info || movie;
  const plot = movieInfo?.plot || movie?.plot || '';
  const genre = movieInfo?.genre || movie?.genre || '';
  const duration = movieInfo?.duration || movie?.duration || '';
  const releaseDate = movieInfo?.releaseDate || movieInfo?.releasedate || movie?.releaseDate || '';
  const cast = movieInfo?.cast || movie?.cast || '';
  const director = movieInfo?.director || movie?.director || '';
  const youtubeTrailer = movieInfo?.youtube_trailer || info?.info?.youtube_trailer || '';
  const trailerValue = youtubeTrailer;
  const backdrop = movieInfo?.backdrop_path?.[0] || info?.info?.backdrop_path?.[0] || '';

  return (
    <div>
      {/* Backdrop banner */}
      {backdrop && (
        <div className="relative -mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-6 h-48 md:h-72 overflow-hidden rounded-b-2xl">
          <img src={backdropImage(backdrop)} alt="" className="w-full h-full object-cover" onError={(e) => { const img = e.target as HTMLImageElement; if (!img.dataset.retried) { img.dataset.retried = '1'; img.src = backdrop; return; } img.style.display = 'none'; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"><ArrowLeft className="w-4 h-4" /> Voltar</button>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary relative">
            {movie.stream_icon ? <img src={posterImage(movie.stream_icon)} alt={movie.name} className="w-full h-full object-cover" onError={(e) => { const img = e.target as HTMLImageElement; if (!img.dataset.retried) { img.dataset.retried = '1'; img.src = movie.stream_icon; } }} /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem capa</div>}
            {(() => {
              const movieProgress = history.find(h => String(h.id) === String(movie.stream_id) && h.type === 'movie');
              if (!movieProgress?.progress || movieProgress.progress <= 0) return null;
              return (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-secondary/80">
                  <div className="h-full bg-destructive rounded-r-full" style={{ width: `${movieProgress.progress}%` }} />
                </div>
              );
            })()}
          </div>
          {(() => {
            const movieProgress = history.find(h => String(h.id) === String(movie.stream_id) && h.type === 'movie');
            if (!movieProgress?.progress || movieProgress.progress <= 0) return null;
            return <p className="text-xs text-muted-foreground mt-1.5">{Math.round(movieProgress.progress)}% assistido</p>;
          })()}
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
          <div className="flex flex-wrap gap-3 pt-2">
            {resumeTime > 0 ? (
              <Button onClick={handlePlay} className="gradient-primary text-primary-foreground font-medium px-6">
                <RotateCcw className="w-4 h-4 mr-2" /> Retomar de {formatTime(resumeTime)}
              </Button>
            ) : (
              <Button onClick={handlePlay} className="gradient-primary text-primary-foreground font-medium px-8">
                <Play className="w-4 h-4 mr-2" /> Assistir
              </Button>
            )}
            <Button variant="outline" onClick={() => toggleFavorite({ id: movie.stream_id, type: 'movie', name: movie.name, icon: movie.stream_icon })} className="border-border text-foreground hover:bg-secondary">
              <Heart className={`w-4 h-4 mr-2 ${isFavorite(movie.stream_id, 'movie') ? 'fill-destructive text-destructive' : ''}`} />
              {isFavorite(movie.stream_id, 'movie') ? 'Favoritado' : 'Favoritar'}
            </Button>
            {trailerValue && <YouTubeTrailer trailer={trailerValue} />}
          </div>
        </div>
      </motion.div>

      {/* Similar movies section */}
      {similarMovies.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10">
          <ContentRow title="Títulos Semelhantes">
            {similarMovies.map(m => (
              <div key={m.stream_id} className="w-32 md:w-40 flex-shrink-0">
                <ContentCard
                  title={m.name}
                  image={m.stream_icon}
                  rating={m.rating}
                  onClick={() => navigate(`/movies/${m.stream_id}`)}
                />
              </div>
            ))}
          </ContentRow>
        </motion.div>
      )}
    </div>
  );
}
