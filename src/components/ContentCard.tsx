import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { posterImage, posterSmall, iconImage, hdImage } from '@/lib/imageProxy';

interface ContentCardProps {
  title: string;
  image?: string;
  subtitle?: string;
  rating?: string | number;
  isFavorite?: boolean;
  isNew?: boolean;
  onFavoriteToggle?: () => void;
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

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer flex-shrink-0"
      onClick={onClick}
    >
      <div className={`relative ${aspectClass} rounded-lg overflow-hidden bg-secondary mb-2`}>
        {hdSrc ? (
          <img
            src={hdSrc}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              const originalSrc = (image || '').trim();
              // If proxy failed, try original directly
              if (img.dataset.retried !== '2' && originalSrc) {
                if (img.dataset.retried === '1') {
                  img.dataset.retried = '2';
                  img.src = originalSrc;
                  return;
                }
                img.dataset.retried = '1';
                // Try without proxy params
                img.src = `https://images.weserv.nl/?url=${encodeURIComponent(originalSrc)}&default=1`;
                return;
              }
              // Final fallback: show title text
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

        {isNew && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider">
            Novo
          </div>
        )}

        {rating && (
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-primary/80 text-primary-foreground text-xs font-medium">
            ★ {rating}
          </div>
        )}
      </div>

      <h3 className="text-sm font-medium text-foreground truncate">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
    </motion.div>
  );
}
