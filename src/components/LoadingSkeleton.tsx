import { motion } from 'framer-motion';

function ShimmerBar({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.8, repeat: Infinity, delay, ease: 'easeInOut' }}
      className={`rounded-lg bg-muted ${className}`}
    />
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative rounded-xl overflow-hidden h-56 md:h-80 lg:h-96 mb-6 bg-muted/50">
      <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 space-y-3 w-2/3">
        <ShimmerBar className="h-4 w-24" />
        <ShimmerBar className="h-8 w-full" delay={0.1} />
        <ShimmerBar className="h-4 w-3/4" delay={0.2} />
        <div className="flex gap-2 pt-2">
          <ShimmerBar className="h-10 w-28 rounded-lg" delay={0.3} />
          <ShimmerBar className="h-10 w-24 rounded-lg" delay={0.4} />
        </div>
      </div>
    </div>
  );
}

export function ContentRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3 mb-4">
      <ShimmerBar className="h-5 w-48" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-32 md:w-40 flex-shrink-0 space-y-2">
            <ShimmerBar className="aspect-[2/3] w-full rounded-xl" delay={i * 0.08} />
            <ShimmerBar className="h-3 w-3/4" delay={i * 0.08 + 0.1} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 12, aspectRatio = 'portrait' }: { count?: number; aspectRatio?: 'portrait' | 'landscape' | 'square' }) {
  const aspectClass = {
    portrait: 'aspect-[2/3]',
    landscape: 'aspect-video',
    square: 'aspect-square',
  }[aspectRatio];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3"
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, duration: 0.3 }}
          className="space-y-2"
        >
          <ShimmerBar className={`${aspectClass} w-full rounded-xl`} delay={i * 0.05} />
          <ShimmerBar className="h-3 w-3/4" delay={i * 0.05 + 0.1} />
          <ShimmerBar className="h-2 w-1/2" delay={i * 0.05 + 0.15} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function SeriesLoadingSkeleton() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Title */}
      <ShimmerBar className="h-8 w-32" />

      {/* Search bar skeleton */}
      <ShimmerBar className="h-12 w-full max-w-lg rounded-xl" delay={0.1} />

      {/* Category pills skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <ShimmerBar key={i} className="h-8 w-20 rounded-full flex-shrink-0" delay={i * 0.05} />
        ))}
      </div>

      {/* Grid skeleton */}
      <GridSkeleton count={14} />
    </motion.div>
  );
}

export function MoviesLoadingSkeleton() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <ShimmerBar className="h-8 w-28" />
      <ShimmerBar className="h-12 w-full max-w-lg rounded-xl" delay={0.1} />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <ShimmerBar key={i} className="h-8 w-20 rounded-full flex-shrink-0" delay={i * 0.05} />
        ))}
      </div>
      <GridSkeleton count={14} />
    </motion.div>
  );
}


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <HeroSkeleton />
      <ContentRowSkeleton />
      <ContentRowSkeleton />
    </motion.div>
  );
}
