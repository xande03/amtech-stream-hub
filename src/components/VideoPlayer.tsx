import { useEffect, useRef, useCallback, useState } from 'react';
import Hls from 'hls.js';
import { ArrowLeft, Maximize, Minimize, Volume2, VolumeX, RotateCcw, PictureInPicture2, SkipForward } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VideoPlayerProps {
  url: string;
  title?: string;
  onProgress?: (progress: number) => void;
  onStreamError?: () => void;
  onNextEpisode?: () => void;
  nextEpisodeLabel?: string;
  autoPlay?: boolean;
  isLive?: boolean;
}

export default function VideoPlayer({ url, title, onProgress, onStreamError, onNextEpisode, nextEpisodeLabel, autoPlay = true, isLive = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onStreamErrorRef = useRef(onStreamError);
  onStreamErrorRef.current = onStreamError;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  // Lock to landscape on mount (mobile)
  useEffect(() => {
    const lockLandscape = async () => {
      try {
        const orientation = screen.orientation;
        if (orientation?.lock) await orientation.lock('landscape');
      } catch {}
    };

    const enterFullscreen = async () => {
      try {
        if (containerRef.current && !document.fullscreenElement) {
          await containerRef.current.requestFullscreen();
        }
      } catch {}
    };

    const timer = setTimeout(() => {
      lockLandscape();
      if (window.innerWidth < 768) enterFullscreen();
    }, 300);

    return () => {
      clearTimeout(timer);
      try { screen.orientation?.unlock?.(); } catch {}
    };
  }, []);

  const tryPlay = useCallback((video: HTMLVideoElement) => {
    if (!autoPlay) return;
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
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
    setShowNextOverlay(false);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = url.includes('.m3u8') || (isLive && !url.includes('.ts'));

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: isLive,
        maxBufferLength: isLive ? 10 : 60,
        maxMaxBufferLength: isLive ? 20 : 120,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
        liveDurationInfinity: isLive,
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 6,
        levelLoadingTimeOut: 20000,
        fragLoadingTimeOut: 25000,
        fragLoadingMaxRetry: 6,
        startFragPrefetch: true,
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
              setTimeout(() => { if (hlsRef.current === hls) hls.startLoad(); }, 2000);
            } else {
              if (onStreamErrorRef.current) onStreamErrorRef.current();
              else setError('Erro de rede. Verifique sua conexão.');
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            if (onStreamErrorRef.current) onStreamErrorRef.current();
            else setError('Erro ao reproduzir este conteúdo.');
          }
        }
      });

      errorTimerRef.current = setTimeout(() => {
        if (video.readyState < 2 && onStreamErrorRef.current) {
          hls.destroy();
          hlsRef.current = null;
          onStreamErrorRef.current();
        }
      }, 15000);

    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => tryPlay(video), { once: true });
      video.addEventListener('error', () => {
        if (onStreamErrorRef.current) onStreamErrorRef.current();
        else setError('Erro ao carregar stream.');
      }, { once: true });
    } else {
      video.src = url;
      video.addEventListener('loadedmetadata', () => tryPlay(video), { once: true });
      video.addEventListener('canplay', () => tryPlay(video), { once: true });
      video.addEventListener('error', () => {
        if (onStreamErrorRef.current) onStreamErrorRef.current();
        else setError('Erro ao carregar o vídeo.');
      }, { once: true });

      errorTimerRef.current = setTimeout(() => {
        if (video.readyState < 2 && onStreamErrorRef.current) {
          onStreamErrorRef.current();
        }
      }, 15000);
    }
  }, [url, isLive, tryPlay]);

  useEffect(() => {
    loadSource();
    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [loadSource]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnter = () => setIsPip(true);
    const onLeave = () => setIsPip(false);
    video.addEventListener('enterpictureinpicture', onEnter);
    video.addEventListener('leavepictureinpicture', onLeave);
    return () => {
      video.removeEventListener('enterpictureinpicture', onEnter);
      video.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration && !isLive) {
      const progress = (video.currentTime / video.duration) * 100;
      if (onProgressRef.current) onProgressRef.current(progress);
      // Show next episode overlay when near end (>90%)
      if (onNextEpisode && progress > 90 && !showNextOverlay) {
        setShowNextOverlay(true);
      }
    }
  }, [isLive, onNextEpisode, showNextOverlay]);

  // Auto-trigger next episode on video end
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onNextEpisode) return;
    const handleEnded = () => onNextEpisode();
    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [onNextEpisode]);

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) document.exitFullscreen();
      else containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) { video.muted = !video.muted; setMuted(video.muted); }
  };

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (document.pictureInPictureEnabled) await video.requestPictureInPicture();
    } catch (e) { console.warn('PiP not supported', e); }
  };

  const retry = () => { retryCountRef.current = 0; loadSource(); };

  return (
    <div ref={containerRef} className="relative bg-background w-full h-full">
      {/* Top bar */}
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
          {onNextEpisode && (
            <button onClick={onNextEpisode} className="p-2 rounded-full bg-secondary/60 backdrop-blur-sm hover:bg-secondary transition-colors" title="Próximo episódio">
              <SkipForward className="w-5 h-5 text-foreground" />
            </button>
          )}
          <button onClick={toggleMute} className="p-2 rounded-full bg-secondary/60 backdrop-blur-sm hover:bg-secondary transition-colors">
            {muted ? <VolumeX className="w-5 h-5 text-foreground" /> : <Volume2 className="w-5 h-5 text-foreground" />}
          </button>
          {document.pictureInPictureEnabled && (
            <button onClick={togglePip} className={`p-2 rounded-full backdrop-blur-sm hover:bg-secondary transition-colors ${isPip ? 'bg-primary/60' : 'bg-secondary/60'}`}>
              <PictureInPicture2 className="w-5 h-5 text-foreground" />
            </button>
          )}
          <button onClick={toggleFullscreen} className="p-2 rounded-full bg-secondary/60 backdrop-blur-sm hover:bg-secondary transition-colors">
            {isFullscreen ? <Minimize className="w-5 h-5 text-foreground" /> : <Maximize className="w-5 h-5 text-foreground" />}
          </button>
        </div>
      </div>

      {/* Next episode overlay */}
      {showNextOverlay && onNextEpisode && (
        <div className="absolute bottom-20 right-4 z-20 animate-fade-in">
          <button
            onClick={onNextEpisode}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-lg hover:bg-primary/90 transition-colors"
          >
            <SkipForward className="w-5 h-5" />
            {nextEpisodeLabel || 'Próximo Episódio'}
          </button>
        </div>
      )}

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
