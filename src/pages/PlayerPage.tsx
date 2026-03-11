import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getStreamUrl, getProxyStreamUrl, getSeriesInfo, Episode } from '@/services/xtreamApi';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import VideoPlayer from '@/components/VideoPlayer';
import { Loader2 } from 'lucide-react';

interface StreamAttempt {
  ext: string;
  proxy: boolean;
}

const LIVE_ATTEMPTS: StreamAttempt[] = [
  { ext: 'm3u8', proxy: false },
  { ext: 'ts', proxy: false },
  { ext: 'm3u8', proxy: true },
  { ext: 'ts', proxy: true },
];

export default function PlayerPage() {
  const { type, id, ext } = useParams<{ type: string; id: string; ext?: string }>();
  const [searchParams] = useSearchParams();
  const { accessCode } = useAuth();
  const { updateProgress, addToHistory } = useWatchHistory();
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const attemptIndex = useRef(0);

  // Series context for next episode
  const seriesId = searchParams.get('seriesId');
  const season = searchParams.get('season');
  const episodeNum = searchParams.get('ep');
  const seriesName = searchParams.get('name');
  const [nextEpisode, setNextEpisode] = useState<Episode | null>(null);
  const [currentTitle, setCurrentTitle] = useState('');

  const isLive = type === 'live';

  // Load series info to find next episode
  useEffect(() => {
    if (type !== 'series' || !seriesId || !accessCode) return;
    getSeriesInfo(accessCode, Number(seriesId)).then(data => {
      const epNum = Number(episodeNum);
      const currentSeason = season || '';
      const eps = data.episodes?.[currentSeason] || [];
      const currentIndex = eps.findIndex(e => e.episode_num === epNum || String(e.id) === id);

      if (currentIndex >= 0 && currentIndex < eps.length - 1) {
        setNextEpisode(eps[currentIndex + 1]);
      } else if (currentIndex === eps.length - 1) {
        // Try next season
        const seasons = Object.keys(data.episodes || {}).sort((a, b) => Number(a) - Number(b));
        const seasonIndex = seasons.indexOf(currentSeason);
        if (seasonIndex >= 0 && seasonIndex < seasons.length - 1) {
          const nextSeasonEps = data.episodes[seasons[seasonIndex + 1]];
          if (nextSeasonEps?.length > 0) setNextEpisode(nextSeasonEps[0]);
        }
      }

      // Set title
      const currentEp = currentIndex >= 0 ? eps[currentIndex] : null;
      if (currentEp && seriesName) {
        setCurrentTitle(`${seriesName} — S${currentEp.season}E${currentEp.episode_num}`);
      }
    }).catch(() => {});
  }, [type, seriesId, season, episodeNum, id, accessCode, seriesName]);

  useEffect(() => {
    if (!accessCode || !type || !id) return;
    setLoading(true);
    setError(null);
    attemptIndex.current = 0;

    const streamType = type as 'live' | 'movie' | 'series';

    if (ext) {
      getStreamUrl(accessCode, streamType, id, ext)
        .then(url => setStreamUrl(url))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
      return;
    }

    if (!isLive) {
      getStreamUrl(accessCode, streamType, id, 'mp4')
        .then(url => setStreamUrl(url))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
      return;
    }

    tryNextAttempt(accessCode, streamType, id, 0);
  }, [accessCode, type, id, ext, isLive]);

  const tryNextAttempt = (code: string, streamType: 'live' | 'movie' | 'series', streamId: string, index: number) => {
    if (index >= LIVE_ATTEMPTS.length) {
      setError('Não foi possível carregar o canal. Tente outro canal.');
      setLoading(false);
      return;
    }

    const attempt = LIVE_ATTEMPTS[index];
    attemptIndex.current = index;

    if (attempt.proxy) {
      const url = getProxyStreamUrl(code, streamType, streamId, attempt.ext);
      setStreamUrl(url);
      setLoading(false);
    } else {
      getStreamUrl(code, streamType, streamId, attempt.ext)
        .then(url => { setStreamUrl(url); setLoading(false); })
        .catch(() => tryNextAttempt(code, streamType, streamId, index + 1));
    }
  };

  const handleStreamError = () => {
    if (!isLive || !accessCode || !id) return;
    const nextIndex = attemptIndex.current + 1;
    if (nextIndex < LIVE_ATTEMPTS.length) {
      setError(null);
      setLoading(true);
      tryNextAttempt(accessCode, type as 'live', id, nextIndex);
    }
  };

  const handleNextEpisode = useCallback(() => {
    if (!nextEpisode || !seriesId) return;
    // Save to history
    if (seriesName) {
      addToHistory({
        id: nextEpisode.id,
        type: 'series',
        name: seriesName,
        icon: nextEpisode.info?.movie_image || '',
        episodeInfo: `S${nextEpisode.season}E${nextEpisode.episode_num}`,
      });
    }
    const extParam = nextEpisode.container_extension || 'mp4';
    const params = new URLSearchParams({
      seriesId,
      season: String(nextEpisode.season),
      ep: String(nextEpisode.episode_num),
      ...(seriesName ? { name: seriesName } : {}),
    });
    navigate(`/player/series/${nextEpisode.id}/${extParam}?${params.toString()}`, { replace: true });
  }, [nextEpisode, seriesId, seriesName, addToHistory, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !streamUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center text-center p-4">
        <p className="text-destructive mb-4">{error || 'Erro ao carregar stream'}</p>
        <button onClick={() => navigate(-1)} className="text-primary underline">Voltar</button>
      </div>
    );
  }

  const handleProgress = (progress: number) => {
    if (type && id && !isLive) {
      updateProgress(id, type, progress);
    }
  };

  const titleMap: Record<string, string> = {
    live: 'Canal ao Vivo',
    movie: 'Filme',
    series: 'Episódio',
  };

  const displayTitle = currentTitle || titleMap[type || ''] || 'Reproduzindo';

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <VideoPlayer
        url={streamUrl}
        title={displayTitle}
        onProgress={!isLive ? handleProgress : undefined}
        onStreamError={handleStreamError}
        onNextEpisode={nextEpisode ? handleNextEpisode : undefined}
        nextEpisodeLabel={nextEpisode ? `Próximo: E${nextEpisode.episode_num}` : undefined}
        autoPlay
        isLive={isLive}
      />
    </div>
  );
}
