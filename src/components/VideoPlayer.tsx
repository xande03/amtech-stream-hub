import { useEffect, useRef, useCallback, useState } from 'react';
import Hls from 'hls.js';
import { motion } from 'framer-motion';
import { ArrowLeft, Maximize, Minimize, Volume2, VolumeX, RotateCcw, PictureInPicture2, SkipForward, Play, Cast, Airplay, Wifi, WifiOff, Loader2, Settings, Gauge } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QualityLevel {
  index: number;
  height: number;
  width: number;
  bitrate: number;
  label: string;
}

function getQualityLabel(height: number): string {
  if (height >= 2160) return '4K';
  if (height >= 1080) return 'FHD';
  if (height >= 720) return 'HD';
  if (height >= 480) return 'SD';
  if (height >= 360) return '360p';
  return `${height}p`;
}

interface VideoPlayerProps {
  url: string;
  title?: string;
  startTime?: number;
  onProgress?: (progress: number, currentTime?: number, duration?: number) => void;
  onStreamError?: () => void;
  onNextEpisode?: () => void;
  nextEpisodeLabel?: string;
  autoPlay?: boolean;
  isLive?: boolean;
  className?: string;
  onClose?: () => void;
}

function CountdownTimer({ seconds, onComplete }: { seconds: number; onComplete: () => void }) {
  const [count, setCount] = useState(seconds);
  useEffect(() => {
    if (count <= 0) { onComplete(); return; }
    const t = setInterval(() => setCount(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [count, onComplete]);
  return <>{count}</>;
}

export default function VideoPlayer({ url, title, startTime = 0, onProgress, onStreamError, onNextEpisode, nextEpisodeLabel, autoPlay = true, isLive = false, className, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [skipIntroDismissed, setSkipIntroDismissed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [showControls, setShowControls] = useState(true);
  const [isCasting, setIsCasting] = useState(false);
  const [castAvailable, setCastAvailable] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'stable' | 'reconnecting' | 'idle'>('idle');
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [airplayAvailable, setAirplayAvailable] = useState(false);
  const retryCountRef = useRef(0);
  const hasResumedRef = useRef(false);
  const maxRetries = 8;
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Double-tap seek state
  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null);
  const [doubleTapCount, setDoubleTapCount] = useState(0);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const doubleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onStreamErrorRef = useRef(onStreamError);
  onStreamErrorRef.current = onStreamError;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  // Lock to landscape on play (mobile)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = async () => {
      if (window.innerWidth < 768) {
        try {
          if (containerRef.current && !document.fullscreenElement) {
            await containerRef.current.requestFullscreen();
          }
          const orientation = screen.orientation as any;
          if (orientation?.lock) await orientation.lock('landscape');
        } catch (e) {
          console.warn('Orientation lock failed:', e);
        }
      }
    };

    video.addEventListener('play', handlePlay);

    // Initial check for mobile
    const timer = setTimeout(() => {
      if (window.innerWidth < 768 && !video.paused) handlePlay();
    }, 500);

    return () => {
      video.removeEventListener('play', handlePlay);
      clearTimeout(timer);
      try { (screen.orientation as any)?.unlock?.(); } catch {}
    };
  }, []);

  const tryPlay = useCallback((video: HTMLVideoElement) => {
    // Resume from saved position
    if (!hasResumedRef.current && startTime > 0) {
      video.currentTime = startTime;
      hasResumedRef.current = true;
    }
    if (!autoPlay) return;
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        video.muted = true;
        setMuted(true);
        video.play().catch(() => {});
      });
    }
  }, [autoPlay, startTime]);

  const loadSource = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setShowNextOverlay(false);
    if (isLive) setConnectionStatus('connecting');
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = url.includes('.m3u8') || (isLive && !url.includes('.ts'));

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: isLive,
        // Buffer tuning for live: small & responsive; VOD: larger for smooth playback
        maxBufferLength: isLive ? 10 : 60,
        maxMaxBufferLength: isLive ? 20 : 120,
        maxBufferSize: isLive ? 40 * 1000 * 1000 : 60 * 1000 * 1000,
        maxBufferHole: isLive ? 0.5 : 0.5,
        // Live sync: stay close to live edge
        liveSyncDurationCount: isLive ? 3 : 3,
        liveMaxLatencyDurationCount: isLive ? 8 : 6,
        liveDurationInfinity: isLive,
        liveBackBufferLength: isLive ? 30 : 90,
        // Adaptive bitrate
        abrEwmaDefaultEstimate: 1500000, // 1.5Mbps initial estimate
        abrEwmaFastLive: isLive ? 3.0 : 3.0,
        abrEwmaSlowLive: isLive ? 9.0 : 9.0,
        abrBandWidthUpFactor: 0.7,
        // Network: generous timeouts for IPTV servers that can be slow
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 10,
        manifestLoadingRetryDelay: 1500,
        manifestLoadingMaxRetryTimeout: 30000,
        levelLoadingTimeOut: 20000,
        levelLoadingMaxRetry: 8,
        levelLoadingRetryDelay: 1500,
        levelLoadingMaxRetryTimeout: 30000,
        fragLoadingTimeOut: 25000,
        fragLoadingMaxRetry: 10,
        fragLoadingRetryDelay: 1000,
        fragLoadingMaxRetryTimeout: 30000,
        startFragPrefetch: true,
        progressive: !isLive,
        backBufferLength: isLive ? 30 : 90,
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        retryCountRef.current = 0;
        // Extract quality levels
        const levels: QualityLevel[] = hls.levels
          .map((l, i) => ({
            index: i,
            height: l.height || 0,
            width: l.width || 0,
            bitrate: l.bitrate || 0,
            label: l.height ? getQualityLabel(l.height) : `${Math.round((l.bitrate || 0) / 1000)}k`,
          }))
          .filter(l => l.height > 0 || l.bitrate > 0)
          .sort((a, b) => b.height - a.height || b.bitrate - a.bitrate);
        // Deduplicate by label
        const seen = new Set<string>();
        const unique = levels.filter(l => { if (seen.has(l.label)) return false; seen.add(l.label); return true; });
        setQualityLevels(unique);
        setCurrentQuality(-1); // Auto

        if (isLive) {
          setConnectionStatus('stable');
          statusTimerRef.current = setTimeout(() => setConnectionStatus('idle'), 4000);
        }
        tryPlay(video);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++;
              if (isLive) setConnectionStatus('reconnecting');
              // Exponential backoff: 1s, 2s, 4s... for CDN reconnection
              const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 8000);
              console.log(`[HLS] Network error, retry ${retryCountRef.current}/${maxRetries} in ${delay}ms`);
              setTimeout(() => {
                if (hlsRef.current === hls) hls.startLoad();
              }, delay);
            } else {
              if (onStreamErrorRef.current) onStreamErrorRef.current();
              else setError('Erro de rede. Verifique sua conexão.');
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            // Try media error recovery (codec switch, buffer flush)
            console.log('[HLS] Media error, attempting recovery...');
            hls.recoverMediaError();
          } else {
            if (onStreamErrorRef.current) onStreamErrorRef.current();
            else setError('Erro ao reproduzir este conteúdo.');
          }
        } else if (isLive && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          // Non-fatal network errors in live: try to recover silently
          console.log('[HLS] Non-fatal network error, continuing...');
        }
      });

      // When a fragment loads successfully after reconnecting, mark stable
      if (isLive) {
        hls.on(Hls.Events.FRAG_LOADED, () => {
          setConnectionStatus(prev => {
            if (prev === 'reconnecting' || prev === 'connecting') {
              if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
              statusTimerRef.current = setTimeout(() => setConnectionStatus('idle'), 4000);
              return 'stable';
            }
            return prev;
          });
        });
      }

      // For live streams, periodically check if playback stalled and recover
      if (isLive) {
        const stallCheck = setInterval(() => {
          if (video.paused || !hlsRef.current || hlsRef.current !== hls) {
            clearInterval(stallCheck);
            return;
          }
          // If buffered but not playing, nudge to live edge
          if (video.readyState >= 2 && video.currentTime > 0) {
            const buffered = video.buffered;
            if (buffered.length > 0) {
              const liveEdge = buffered.end(buffered.length - 1);
              const lag = liveEdge - video.currentTime;
              // If too far behind live edge (>15s), jump forward
              if (lag > 15) {
                console.log(`[HLS Live] Lag ${lag.toFixed(1)}s, jumping to live edge`);
                video.currentTime = liveEdge - 2;
              }
            }
          }
        }, 5000);

        // Clean up stall checker
        const origDestroy = hls.destroy.bind(hls);
        hls.destroy = () => { clearInterval(stallCheck); origDestroy(); };
      }

      errorTimerRef.current = setTimeout(() => {
        if (video.readyState < 2 && onStreamErrorRef.current) {
          hls.destroy();
          hlsRef.current = null;
          onStreamErrorRef.current();
        }
      }, 20000);

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
      // Stop playback completely on unmount to prevent audio leaking
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, [loadSource]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  // PiP events
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

  // Auto-enter PiP when user leaves the page/app (visibility change)
  useEffect(() => {
    const handleVisibility = async () => {
      const video = videoRef.current;
      if (!video || video.paused) return;
      if (document.hidden && document.pictureInPictureEnabled && !document.pictureInPictureElement) {
        try {
          await video.requestPictureInPicture();
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Media Session API for lock screen / notification controls
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'Reproduzindo',
      artist: isLive ? 'TV ao Vivo' : 'Xerife Player',
      album: 'Xerife Player',
    });

    navigator.mediaSession.setActionHandler('play', () => {
      videoRef.current?.play().catch(() => {});
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      videoRef.current?.pause();
    });
    navigator.mediaSession.setActionHandler('stop', () => {
      videoRef.current?.pause();
    });
    if (!isLive) {
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        const v = videoRef.current;
        if (v) v.currentTime = Math.max(0, v.currentTime - 10);
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        const v = videoRef.current;
        if (v) v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
      });
    }
    if (onNextEpisode) {
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        onNextEpisode();
      });
    }

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      } catch {}
    };
  }, [title, isLive, onNextEpisode]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration && !isLive) {
      const progress = (video.currentTime / video.duration) * 100;
      const currentTime = video.currentTime;
      if (onProgressRef.current) onProgressRef.current(progress, currentTime, video.duration);
      // Show skip intro in first 2 minutes (10s-120s)
      if (!skipIntroDismissed && currentTime >= 10 && currentTime <= 120) {
        if (!showSkipIntro) setShowSkipIntro(true);
      } else if (showSkipIntro) {
        setShowSkipIntro(false);
      }
      // Show next episode overlay when near end (>95% for auto-next)
      if (onNextEpisode && progress >= 95 && !showNextOverlay) {
        setShowNextOverlay(true);
      }
    }
  }, [isLive, onNextEpisode, showNextOverlay, showSkipIntro, skipIntroDismissed]);

  // Auto-trigger next episode on video end
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onNextEpisode) return;
    const handleEnded = () => onNextEpisode();
    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [onNextEpisode]);

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container && !video) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if ((document as any).webkitFullscreenElement) {
        await (document as any).webkitExitFullscreen();
      } else if (container?.requestFullscreen) {
        await container.requestFullscreen();
      } else if ((container as any)?.webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if ((video as any)?.webkitEnterFullscreen) {
        // iOS Safari: only supports fullscreen on the video element itself
        (video as any).webkitEnterFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen not supported', e);
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
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      } else if ((video as any).webkitSupportsPresentationMode?.('picture-in-picture')) {
        // Safari fallback
        (video as any).webkitSetPresentationMode('picture-in-picture');
      }
    } catch (e) { console.warn('PiP not supported', e); }
  };

  const isPipSupported = document.pictureInPictureEnabled || 
    (videoRef.current && (videoRef.current as any).webkitSupportsPresentationMode?.('picture-in-picture'));

  const retry = () => { retryCountRef.current = 0; loadSource(); };

  // Double-tap to seek ±10s
  const handleDoubleTap = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (isLive) return;
    const touch = e.changedTouches[0];
    if (!touch || !containerRef.current) return;
    const now = Date.now();
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const side = x < rect.width / 2 ? 'left' : 'right';
    const prev = lastTapRef.current;
    const delta = now - prev.time;
    const sameSide = side === (prev.x < rect.width / 2 ? 'left' : 'right');

    lastTapRef.current = { time: now, x };

    if (delta < 350 && sameSide) {
      // Double tap detected
      e.preventDefault();
      const video = videoRef.current;
      if (!video) return;
      if (side === 'left') {
        video.currentTime = Math.max(0, video.currentTime - 10);
      } else {
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
      }
      // Visual feedback
      setDoubleTapSide(side);
      setDoubleTapCount(c => {
        if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
        const next = c + 1;
        doubleTapTimerRef.current = setTimeout(() => {
          setDoubleTapSide(null);
          setDoubleTapCount(0);
        }, 600);
        return next;
      });
    }
  }, [isLive]);

  // Remote Playback API (Cast/Airplay)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !('remote' in video)) return;

    const remote = (video as any).remote;
    remote.watchAvailability((available: boolean) => {
      setCastAvailable(available);
    }).catch(() => {
      // watchAvailability not supported, show button anyway as fallback
      setCastAvailable(true);
    });

    const onConnect = () => setIsCasting(true);
    const onDisconnect = () => setIsCasting(false);
    remote.addEventListener('connect', onConnect);
    remote.addEventListener('disconnect', onDisconnect);

    return () => {
      remote.removeEventListener('connect', onConnect);
      remote.removeEventListener('disconnect', onDisconnect);
      remote.cancelWatchAvailability().catch(() => {});
    };
  }, []);

  // Airplay availability check
  useEffect(() => {
    if ((window as any).WebKitPlaybackTargetAvailabilityEvent) {
      const video = videoRef.current;
      if (!video) return;
      const handleAvailability = (e: any) => {
        setAirplayAvailable(e.availability === 'available');
      };
      video.addEventListener('webkitplaybacktargetavailabilitychanged', handleAvailability);
      return () => video.removeEventListener('webkitplaybacktargetavailabilitychanged', handleAvailability);
    } else if ((window as any).WebKitPlaybackTargetAvailabilityEvent) {
       // Safari
       setAirplayAvailable(true);
    }
  }, []);

  const toggleAirplay = () => {
    const video = videoRef.current;
    if (video && (video as any).webkitShowPlaybackTargetPicker) {
      (video as any).webkitShowPlaybackTargetPicker();
    }
  };

  const toggleCast = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if ('remote' in video) {
        await (video as any).remote.prompt();
      }
    } catch (e) {
      console.warn('Remote playback not supported', e);
    }
  };

  const setQuality = (levelIndex: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = levelIndex; // -1 = auto
    setCurrentQuality(levelIndex);
    setShowQualityMenu(false);
  };

  const currentQualityLabel = currentQuality === -1
    ? 'Auto'
    : qualityLevels.find(l => l.index === currentQuality)?.label || 'Auto';

  return (
    <div 
      ref={containerRef}
      className={`relative group bg-black overflow-hidden flex flex-col ${className || 'w-full h-full aspect-video md:aspect-auto md:h-full'}`}
      onMouseMove={() => { setShowControls(true); }}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
      onTouchEnd={handleDoubleTap}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 p-3 md:p-4 bg-gradient-to-b from-background/80 to-transparent">
        <button onClick={() => {
          if (onClose) {
            onClose();
            return;
          }
          // If opened in a new tab (no history), close the tab or navigate to /live
          if (window.history.length <= 1) {
            try { window.close(); } catch {}
            // If window.close() didn't work (not opened via script), navigate
            navigate('/live');
          } else {
            navigate(-1);
          }
        }} className="p-2 rounded-full bg-secondary/60 backdrop-blur-sm hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        {title && <h2 className="text-foreground font-medium truncate text-sm md:text-base flex-1">{title}</h2>}
        {isLive && (
          <span className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wider">
            AO VIVO
          </span>
        )}
        {isLive && connectionStatus !== 'idle' && (
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm transition-all animate-fade-in ${
            connectionStatus === 'connecting' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
            connectionStatus === 'reconnecting' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {connectionStatus === 'connecting' && <Loader2 className="w-3 h-3 animate-spin" />}
            {connectionStatus === 'reconnecting' && <WifiOff className="w-3 h-3" />}
            {connectionStatus === 'stable' && <Wifi className="w-3 h-3" />}
            {connectionStatus === 'connecting' && 'Conectando...'}
            {connectionStatus === 'reconnecting' && 'Reconectando...'}
            {connectionStatus === 'stable' && 'Estável'}
          </span>
        )}
        <div className="flex gap-1 items-center">
          {/* Speed selector (movies & series only) */}
          {!isLive && (
            <div className="relative">
              <button
                onClick={() => { setShowSpeedMenu(v => !v); setShowQualityMenu(false); }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-secondary/60 backdrop-blur-sm hover:bg-secondary transition-colors"
                title="Velocidade"
              >
                <Gauge className="w-4 h-4 text-foreground" />
                <span className="text-xs font-medium text-foreground hidden sm:inline">{playbackSpeed}x</span>
              </button>
              {showSpeedMenu && (
                <div className="absolute top-full right-0 mt-1 bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-lg overflow-hidden min-w-[100px] z-30 animate-fade-in">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => {
                        const video = videoRef.current;
                        if (video) video.playbackRate = speed;
                        setPlaybackSpeed(speed);
                        setShowSpeedMenu(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-secondary/60 transition-colors ${playbackSpeed === speed ? 'text-primary font-semibold' : 'text-foreground'}`}
                    >
                      <span>{speed}x</span>
                      {playbackSpeed === speed && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Quality selector */}
          {qualityLevels.length > 1 && (
            <div className="relative">
              <button
                onClick={() => { setShowQualityMenu(v => !v); setShowSpeedMenu(false); }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-secondary/60 backdrop-blur-sm hover:bg-secondary transition-colors"
                title="Qualidade"
              >
                <Settings className="w-4 h-4 text-foreground" />
                <span className="text-xs font-medium text-foreground hidden sm:inline">{currentQualityLabel}</span>
              </button>
              {showQualityMenu && (
                <div className="absolute top-full right-0 mt-1 bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-lg overflow-hidden min-w-[140px] z-30 animate-fade-in">
                  <button
                    onClick={() => setQuality(-1)}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-secondary/60 transition-colors ${currentQuality === -1 ? 'text-primary font-semibold' : 'text-foreground'}`}
                  >
                    Auto
                    {currentQuality === -1 && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                  {qualityLevels.map(level => (
                    <button
                      key={level.index}
                      onClick={() => setQuality(level.index)}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-secondary/60 transition-colors ${currentQuality === level.index ? 'text-primary font-semibold' : 'text-foreground'}`}
                    >
                      <span>{level.label}</span>
                      <span className="text-xs text-muted-foreground">{level.height}p</span>
                      {currentQuality === level.index && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-2" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {onNextEpisode && (
            <button onClick={onNextEpisode} className="p-2 rounded-full bg-secondary/60 backdrop-blur-sm hover:bg-secondary transition-colors" title="Próximo episódio">
              <SkipForward className="w-5 h-5 text-foreground" />
            </button>
          )}
          <button onClick={toggleMute} className="p-2 rounded-full bg-secondary/60 backdrop-blur-sm hover:bg-secondary transition-colors">
            {muted ? <VolumeX className="w-5 h-5 text-foreground" /> : <Volume2 className="w-5 h-5 text-foreground" />}
          </button>
          {castAvailable && (
            <button onClick={toggleCast} className={`p-2 rounded-full backdrop-blur-sm hover:bg-secondary transition-colors ${isCasting ? 'bg-primary/60' : 'bg-secondary/60'}`} title="Transmitir (Chromecast)">
              <Cast className="w-5 h-5 text-foreground" />
            </button>
          )}
          {airplayAvailable && (
            <button onClick={toggleAirplay} className="p-2 rounded-full backdrop-blur-sm bg-secondary/60 hover:bg-secondary transition-colors" title="Espelhar (AirPlay)">
              <Airplay className="w-5 h-5 text-foreground" />
            </button>
          )}
          {isPipSupported && (
            <button onClick={togglePip} className={`p-2 rounded-full backdrop-blur-sm hover:bg-secondary transition-colors ${isPip ? 'bg-primary/60' : 'bg-secondary/60'}`} title="Picture in Picture">
              <PictureInPicture2 className="w-5 h-5 text-foreground" />
            </button>
          )}
          <button onClick={toggleFullscreen} className="p-2 rounded-full bg-secondary/60 backdrop-blur-sm hover:bg-secondary transition-colors">
            {isFullscreen ? <Minimize className="w-5 h-5 text-foreground" /> : <Maximize className="w-5 h-5 text-foreground" />}
          </button>
        </div>
      </div>

      {/* Skip Intro button */}
      {showSkipIntro && !skipIntroDismissed && (
        <div className="absolute bottom-20 left-4 z-20 animate-fade-in">
          <button
            onClick={() => {
              const video = videoRef.current;
              if (video) video.currentTime = 120;
              setShowSkipIntro(false);
              setSkipIntroDismissed(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary/90 backdrop-blur-sm text-foreground font-medium text-sm shadow-lg border border-border hover:bg-secondary transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            Pular Intro
          </button>
        </div>
      )}

      {/* Next episode overlay with countdown */}
      {showNextOverlay && onNextEpisode && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-500">
          <div className="bg-card/90 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center text-center max-w-sm">
            <h3 className="text-xl font-bold text-white mb-2">Próximo Episódio</h3>
            <p className="text-white/60 text-sm mb-6">{nextEpisodeLabel || 'O próximo episódio começará em instantes'}</p>
            
            <div className="relative w-24 h-24 mb-8">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/10"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="276"
                  initial={{ strokeDashoffset: 276 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 5, ease: "linear" }}
                  onAnimationComplete={onNextEpisode}
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span 
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ repeat: 5, duration: 1, repeatType: "reverse" }}
                  className="text-2xl font-black text-white"
                >
                  <CountdownTimer seconds={5} onComplete={() => {}} />
                </motion.span>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowNextOverlay(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button 
                onClick={onNextEpisode}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <SkipForward className="w-4 h-4 fill-current" /> Agora
              </button>
            </div>
          </div>
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

      {/* Click overlay to close menus */}
      {(showQualityMenu || showSpeedMenu) && (
        <div className="absolute inset-0 z-15" onClick={() => { setShowQualityMenu(false); setShowSpeedMenu(false); }} />
      )}

      {/* Double-tap seek feedback overlay */}
      {doubleTapSide && (
        <div
          className={`absolute top-0 bottom-0 z-20 flex items-center justify-center pointer-events-none animate-fade-in ${
            doubleTapSide === 'left' ? 'left-0 w-1/2' : 'right-0 w-1/2'
          }`}
        >
          <div className="flex flex-col items-center gap-1 bg-background/40 backdrop-blur-sm rounded-full px-6 py-4">
            {doubleTapSide === 'left' ? (
              <RotateCcw className="w-8 h-8 text-foreground animate-spin" style={{ animationDuration: '0.5s', animationIterationCount: 1 }} />
            ) : (
              <SkipForward className="w-8 h-8 text-foreground" />
            )}
            <span className="text-foreground text-sm font-semibold">
              {doubleTapCount * 10}s
            </span>
          </div>
        </div>
      )}

      {/* Central Play Button Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <button
            onClick={() => videoRef.current?.play()}
            className="w-20 h-20 flex items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-2xl hover:scale-110 active:scale-95 transition-all group"
          >
            <Play className="w-10 h-10 fill-current group-hover:scale-110 transition-transform ml-1" />
          </button>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        playsInline
        x-webkit-airplay="allow"
        disablePictureInPicture={false}
        muted={muted}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}
