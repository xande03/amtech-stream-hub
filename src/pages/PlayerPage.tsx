import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getStreamUrl } from '@/services/xtreamApi';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import VideoPlayer from '@/components/VideoPlayer';
import { Loader2 } from 'lucide-react';

export default function PlayerPage() {
  const { type, id, ext } = useParams<{ type: string; id: string; ext?: string }>();
  const { accessCode } = useAuth();
  const { updateProgress } = useWatchHistory();
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isLive = type === 'live';

  useEffect(() => {
    if (!accessCode || !type || !id) return;
    setLoading(true);
    setError(null);
    const streamType = type as 'live' | 'movie' | 'series';
    // For live, try m3u8 first; for VOD use mp4 or provided ext
    const extension = ext || (isLive ? 'm3u8' : 'mp4');
    getStreamUrl(accessCode, streamType, id, extension)
      .then(url => setStreamUrl(url))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [accessCode, type, id, ext, isLive]);

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

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <VideoPlayer
        url={streamUrl}
        title={titleMap[type || ''] || 'Reproduzindo'}
        onProgress={!isLive ? handleProgress : undefined}
        autoPlay
        isLive={isLive}
      />
    </div>
  );
}
