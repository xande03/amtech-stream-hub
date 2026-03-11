import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

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
}: ContentCardProps) {
  const aspectClass = {
    portrait: 'aspect-[2/3]',
    landscape: 'aspect-video',
    square: 'aspect-square',
  }[aspectRatio];

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer flex-shrink-0"
      onClick={onClick}
    >
      <div className={`relative ${aspectClass} rounded-lg overflow-hidden bg-secondary mb-2`}>
        {image && image.trim() ? (
          <img
            src={image.trim()}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const fallback = img.parentElement?.querySelector('[data-fallback]') as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          data-fallback
          className="w-full h-full flex items-center justify-center bg-secondary absolute inset-0"
          style={{ display: image && image.trim() ? 'none' : 'flex' }}
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
