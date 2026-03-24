import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trash2, Star } from 'lucide-react';
import { posterImage, posterSmall, iconImage, hdImage } from '@/lib/imageProxy';

interface ContentCardProps {
  title: string;
  image?: string;
  subtitle?: string;
  rating?: string | number;
  isFavorite?: boolean;
  isNew?: boolean;
  onFavoriteToggle?: () => void;
  onRemove?: () => void;
  onClick?: () => void;
  aspectRatio?: 'portrait' | 'landscape' | 'square';
  hdSize?: 'small' | 'normal';
}

export default function ContentCard({
  title,
  image,
  subtitle,
  rating,
  isFavorite,
  isNew,
  onFavoriteToggle,
  onRemove,
  onClick,
  aspectRatio = 'portrait',
  hdSize = 'normal',
}: ContentCardProps) {
  const aspectClass = {
    portrait: 'aspect-[2/3]',
    landscape: 'aspect-video',
    square: 'aspect-square',
  }[aspectRatio];

  // Choose proxy function based on aspect ratio and size
  const getHdUrl = (url?: string) => {
    if (!url) return '';
    if (aspectRatio === 'square') return iconImage(url);
    if (aspectRatio === 'landscape') return hdImage(url, { width: 480, height: 270, quality: 85 });
    return hdSize === 'small' ? posterSmall(url) : posterImage(url);
  };

  const hdSrc = getHdUrl(image);
  // Tiny blur placeholder (20px wide)
  const blurSrc = image ? hdImage(image, { width: 20, height: 30, quality: 20, format: 'jpg' }) : '';
  const [loaded, setLoaded] = useState(false);
  const onLoad = useCallback(() => setLoaded(true), []);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer flex-shrink-0"
      onClick={onClick}
    >
      <div className={`relative ${aspectClass} rounded-lg overflow-hidden bg-secondary mb-2`}>
        {/* Blur placeholder */}
        {blurSrc && !loaded && (
          <img
            src={blurSrc}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-md"
          />
        )}
        {hdSrc ? (
          <img
            src={hdSrc}
            alt={title}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 brightness-110 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={onLoad}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              const originalSrc = (image || '').trim();
              if (img.dataset.retried !== '2' && originalSrc) {
                if (img.dataset.retried === '1') {
                  img.dataset.retried = '2';
                  img.src = originalSrc;
                  return;
                }
                img.dataset.retried = '1';
                img.src = `https://images.weserv.nl/?url=${encodeURIComponent(originalSrc)}&default=1`;
                return;
              }
              img.style.display = 'none';
              const fallback = img.parentElement?.querySelector('[data-fallback]') as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          data-fallback
          className="w-full h-full flex items-center justify-center bg-secondary absolute inset-0"
          style={{ display: hdSrc ? 'none' : 'flex' }}
        >
          <span className="text-muted-foreground text-xs text-center px-2 line-clamp-3">{title}</span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {onFavoriteToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle();
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? 'fill-destructive text-destructive' : 'text-foreground'}`}
            />
          </button>
        )}

        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-2 left-2 p-1.5 rounded-full bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-background/80"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        )}

        {isNew && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider">
            Novo
          </div>
        )}

        {rating && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-black flex items-center gap-1 shadow-lg border border-white/10">
            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
            <span>{rating}</span>
          </div>
        )}
      </div>

      <h3 className="text-sm font-medium text-foreground truncate">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
    </motion.div>
  );
}
