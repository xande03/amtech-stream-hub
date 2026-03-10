import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { buildStreamUrl } from '@/services/xtreamApi';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import VideoPlayer from '@/components/VideoPlayer';

export default function PlayerPage() {
  const { type, id, ext } = useParams<{ type: string; id: string; ext?: string }>();
  const { credentials } = useAuth();
  const { updateProgress } = useWatchHistory();

  if (!credentials || !type || !id) return null;

  const streamType = type as 'live' | 'movie' | 'series';
  const extension = ext || (streamType === 'live' ? 'm3u8' : 'mp4');
  const url = buildStreamUrl(credentials, streamType, id, extension);

  const handleProgress = (progress: number) => {
    updateProgress(id, streamType, progress);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <VideoPlayer
        url={url}
        title={`${type === 'live' ? 'Canal' : type === 'movie' ? 'Filme' : 'Episódio'}`}
        onProgress={streamType !== 'live' ? handleProgress : undefined}
        autoPlay
      />
    </div>
  );
}
