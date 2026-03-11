import { useEffect, useRef, useCallback, useState } from 'react';
import Hls from 'hls.js';
import { ArrowLeft, Maximize, Minimize, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VideoPlayerProps {
  url: string;
  title?: string;
  onProgress?: (progress: number) => void;
  onStreamError?: () => void;
  autoPlay?: boolean;
  isLive?: boolean;
}

export default function VideoPlayer({ url, title, onProgress, onStreamError, autoPlay = true, isLive = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  const tryPlay = useCallback((video: HTMLVideoElement) => {
    if (!autoPlay) return;
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Try muted autoplay as fallback
        video.muted = true;
        setMuted(true);
        video.play().catch(() => {});
      });
    }
  }, [autoPlay]);

  const loadSource = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = url.includes('.m3u8');

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: isLive,
          maxBufferLength: isLive ? 10 : 30,
          maxMaxBufferLength: isLive ? 20 : 60,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 6,
          liveDurationInfinity: isLive,
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 6,
          levelLoadingTimeOut: 15000,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 6,
        });

        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          retryCountRef.current = 0;
          tryPlay(video);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              if (retryCountRef.current < maxRetries) {
                retryCountRef.current++;
                setTimeout(() => hls.startLoad(), 2000);
              } else {
                setError('Erro de rede. Verifique sua conexão.');
              }
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              setError('Erro ao reproduzir este conteúdo.');
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari/iOS)
        video.src = url;
        video.addEventListener('loadedmetadata', () => tryPlay(video), { once: true });
        video.addEventListener('error', () => setError('Erro ao carregar stream.'), { once: true });
      } else {
        setError('Seu navegador não suporta reprodução HLS.');
      }
    } else {
      // Direct MP4/other formats
      video.src = url;
      video.addEventListener('loadedmetadata', () => tryPlay(video), { once: true });
      video.addEventListener('error', () => {
        setError('Erro ao carregar o vídeo.');
      }, { once: true });
    }
  }, [url, isLive, tryPlay]);

  useEffect(() => {
    loadSource();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [loadSource]);

  // Fullscreen change listener
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration && onProgress && !isLive) {
      onProgress((video.currentTime / video.duration) * 100);
    }
  }, [onProgress, isLive]);

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setMuted(video.muted);
    }
  };

  const retry = () => {
    retryCountRef.current = 0;
    loadSource();
  };

  return (
    <div ref={containerRef} className="relative bg-background w-full h-full">
      {/* Top controls overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 p-3 md:p-4 bg-gradient-to-b from-background/80 to-transparent">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-secondary/60 backdrop-blur-sm hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        {title && <h2 className="text-foreground font-medium truncate text-sm md:text-base flex-1">{title}</h2>}
        {isLive && (
          <span className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wider">
            AO VIVO
          </span>
        )}
        <div className="flex gap-1">
          <button onClick={toggleMute} className="p-2 rounded-full bg-secondary/60 backdrop-blur-sm hover:bg-secondary transition-colors">
            {muted ? <VolumeX className="w-5 h-5 text-foreground" /> : <Volume2 className="w-5 h-5 text-foreground" />}
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-full bg-secondary/60 backdrop-blur-sm hover:bg-secondary transition-colors">
            {isFullscreen ? <Minimize className="w-5 h-5 text-foreground" /> : <Maximize className="w-5 h-5 text-foreground" />}
          </button>
        </div>
      </div>

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/90 text-center p-6">
          <p className="text-destructive font-medium mb-4">{error}</p>
          <button onClick={retry} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium">
            <RotateCcw className="w-4 h-4" /> Tentar novamente
          </button>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        playsInline
        muted={muted}
        onTimeUpdate={handleTimeUpdate}
      />
    </div>
  );
}
