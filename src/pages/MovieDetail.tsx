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
    <div className="pb-24">
      {/* Backdrop banner (Mobile: Full width poster-style, Desktop: classic backdrop) */}
      <div className="relative -mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-6 md:h-96 md:aspect-auto aspect-[3/4] overflow-hidden">
        {/* On mobile, use poster if backdrop is missing, else backdrop. We'll use backdrop or poster */}
        <img 
          src={backdrop ? backdropImage(backdrop) : posterImage(movie.stream_icon || '')} 
          alt="" 
          className="w-full h-full object-cover md:object-cover" 
          onError={(e) => { const img = e.target as HTMLImageElement; if (!img.dataset.retried) { img.dataset.retried = '1'; img.src = backdrop || movie.stream_icon || ''; return; } img.style.display = 'none'; }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Fixed back button overlay */}
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center md:items-start md:flex-row gap-6 md:px-4">
        {/* Desktop Poster (hidden on mobile as it's the backdrop) */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary relative shadow-lg">
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
        </div>

        <div className="flex-1 w-full space-y-5 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black text-foreground uppercase tracking-wide">{movie.name}</h1>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm font-medium text-muted-foreground">
            {movie.rating && <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full"><Star className="w-4 h-4 fill-primary text-primary" /> {movie.rating}</span>}
            {releaseDate && <span className="px-3 py-1 rounded-full bg-secondary/50">{releaseDate.split('-')[0]}</span>}
            {duration && <span className="flex items-center gap-1.5 px-3 py-1"><Clock className="w-4 h-4" /> {duration}</span>}
          </div>

          {genre && (
            <div className="font-medium text-foreground text-sm overflow-hidden text-ellipsis whitespace-nowrap px-4 md:px-0">
              {genre.split(',').map(g => g.trim()).join(', ')}
            </div>
          )}

          <div className="pt-2 px-4 md:px-0 flex flex-col gap-4">
            {resumeTime > 0 ? (
              <Button onClick={handlePlay} className="w-full py-6 text-base rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25">
                <RotateCcw className="w-5 h-5 mr-2" /> Continuar Assistindo ({formatTime(resumeTime)})
              </Button>
            ) : (
              <Button onClick={handlePlay} className="w-full py-6 text-base rounded-full bg-white hover:bg-white/90 text-black font-bold shadow-lg">
                <Play className="w-5 h-5 mr-3 fill-black text-black" /> Reproduzir filme
              </Button>
            )}

            <div className="flex items-center justify-center md:justify-start gap-4 py-2">
              <button 
                onClick={() => toggleFavorite({ id: movie.stream_id, type: 'movie', name: movie.name, icon: movie.stream_icon })} 
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`p-4 rounded-full border border-border bg-background transition-colors group-hover:bg-secondary ${isFavorite(movie.stream_id, 'movie') ? 'border-primary/50' : ''}`}>
                  <Heart className={`w-5 h-5 ${isFavorite(movie.stream_id, 'movie') ? 'fill-primary text-primary' : 'text-foreground'}`} />
                </div>
              </button>

              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!accessCode || isDownloaded(movie.stream_id, 'movie')) return;
                  try {
                    const url = await getStreamUrl(accessCode, 'movie', movie.stream_id, movie.container_extension || 'mp4');
                    startDownload({ id: movie.stream_id, type: 'movie', name: movie.name, icon: movie.stream_icon || '', url });
                  } catch { /* ignore */ }
                }}
                disabled={isDownloaded(movie.stream_id, 'movie')}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="p-4 rounded-full border border-border bg-background transition-colors group-hover:bg-secondary disabled:opacity-50">
                  {(() => {
                    const dl = getDownloadStatus(movie.stream_id, 'movie');
                    if (dl?.status === 'completed') return <CheckCircle2 className="w-5 h-5 text-primary" />;
                    if (dl?.status === 'downloading') return <Loader2 className="w-5 h-5 animate-spin" />;
                    return <Download className="w-5 h-5 text-foreground" />;
                  })()}
                </div>
              </button>

              {trailerValue && (
                <div className="flex flex-col items-center gap-2 group">
                  <div className="p-4 rounded-full border border-border bg-background transition-colors group-hover:bg-secondary">
                    <YouTubeTrailer trailer={trailerValue} className="w-5 h-5 text-foreground" />
                  </div>
                </div>
              )}
              
              <Button variant="outline" className="rounded-full px-6 py-6 border-border text-foreground hover:bg-secondary ml-2 font-medium">
                Outras fontes
              </Button>
            </div>
          </div>

          <div className="px-4 md:px-0 text-left space-y-3 mt-4">
            {plot && <p className="text-muted-foreground text-sm/relaxed select-text">{plot}</p>}
            {cast && <p className="text-sm text-muted-foreground mt-4"><span className="text-foreground font-semibold">Elenco:</span> {cast}</p>}
            {director && <p className="text-sm text-muted-foreground"><span className="text-foreground font-semibold">Diretor:</span> {director}</p>}
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
