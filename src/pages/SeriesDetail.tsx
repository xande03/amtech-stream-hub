import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { getSeriesInfo, SeriesInfo, Episode } from '@/services/xtreamApi';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Play, Heart, ArrowLeft, Star } from 'lucide-react';
import { SeriesDetailSkeleton } from '@/components/LoadingSkeleton';

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessCode } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToHistory } = useWatchHistory();
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessCode || !id) return;
    setLoading(true);
    getSeriesInfo(accessCode, Number(id))
      .then((data) => {
        setSeriesInfo(data);
        const seasons = Object.keys(data.episodes || {}).sort((a, b) => Number(a) - Number(b));
        if (seasons.length > 0) setSelectedSeason(seasons[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessCode, id]);

  const handlePlayEpisode = (episode: Episode) => {
    if (!seriesInfo) return;
    addToHistory({ id: episode.id, type: 'series', name: seriesInfo.info.name, icon: seriesInfo.info.cover, episodeInfo: `S${episode.season}E${episode.episode_num}` });
    navigate(`/player/series/${episode.id}/${episode.container_extension || 'mp4'}`);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!seriesInfo) return <div className="text-center py-12 text-muted-foreground">Série não encontrada.<br /><button onClick={() => navigate('/series')} className="text-primary mt-4 underline">Voltar</button></div>;

  const { info, episodes } = seriesInfo;
  const seasons = Object.keys(episodes || {}).sort((a, b) => Number(a) - Number(b));
  const currentEpisodes = episodes[selectedSeason] || [];

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"><ArrowLeft className="w-4 h-4" /> Voltar</button>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-full md:w-56 flex-shrink-0">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
              {info.cover ? <img src={info.cover} alt={info.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem capa</div>}
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{info.name}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {info.rating && <span className="flex items-center gap-1"><Star className="w-4 h-4 text-primary" /> {info.rating}</span>}
              {info.releaseDate && <span>{info.releaseDate}</span>}
              {info.genre && <span>{info.genre}</span>}
            </div>
            {info.plot && <p className="text-muted-foreground text-sm leading-relaxed">{info.plot}</p>}
            {info.cast && <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Elenco:</span> {info.cast}</p>}
            {info.director && <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Diretor:</span> {info.director}</p>}
            <Button variant="outline" onClick={() => toggleFavorite({ id: info.series_id, type: 'series', name: info.name, icon: info.cover })} className="border-border text-foreground hover:bg-secondary">
              <Heart className={`w-4 h-4 mr-2 ${isFavorite(info.series_id, 'series') ? 'fill-destructive text-destructive' : ''}`} />
              {isFavorite(info.series_id, 'series') ? 'Favoritado' : 'Favoritar'}
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {seasons.map(s => (
              <button key={s} onClick={() => setSelectedSeason(s)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedSeason === s ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                Temporada {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {currentEpisodes.map((ep) => (
            <motion.div key={ep.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => handlePlayEpisode(ep)}>
              <div className="w-24 h-14 rounded-md overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                {ep.info?.movie_image ? <img src={ep.info.movie_image} alt={ep.title} className="w-full h-full object-cover" /> : <Play className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">E{ep.episode_num} — {ep.title}</p>
                {ep.info?.plot && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ep.info.plot}</p>}
                {ep.info?.duration && <p className="text-xs text-muted-foreground mt-0.5">{ep.info.duration}</p>}
              </div>
              <Play className="w-5 h-5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
            </motion.div>
          ))}
        </div>
        {currentEpisodes.length === 0 && <div className="text-center py-8 text-muted-foreground">Nenhum episódio encontrado nesta temporada.</div>}
      </motion.div>
    </div>
  );
}
