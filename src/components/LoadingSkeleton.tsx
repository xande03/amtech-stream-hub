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

export function LiveTVSkeleton() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <ShimmerBar className="h-8 w-36" />
        <ShimmerBar className="h-8 w-24 rounded-lg" delay={0.05} />
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <ShimmerBar className="h-10 w-full max-w-sm rounded-lg" delay={0.1} />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerBar key={i} className="h-8 w-20 rounded-full flex-shrink-0" delay={0.12 + i * 0.04} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.3 }}
            className="rounded-lg p-3 space-y-2"
          >
            <ShimmerBar className="aspect-square w-full rounded-md" delay={i * 0.04} />
            <ShimmerBar className="h-3 w-3/4" delay={i * 0.04 + 0.1} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="pb-24">
      {/* Backdrop skeleton */}
      <div className="relative -mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-6 md:h-96 md:aspect-auto aspect-[3/4] overflow-hidden bg-muted/20">
        <ShimmerBar className="w-full h-full rounded-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center md:items-start md:flex-row gap-6 md:px-4">
        {/* Desktop Poster */}
        <div className="hidden md:block w-64 flex-shrink-0 z-10">
          <ShimmerBar className="aspect-[2/3] rounded-xl w-full relative -mt-32 border-4 border-background" />
        </div>
        
        <div className="flex-1 w-full space-y-5 text-center md:text-left z-10">
          <ShimmerBar className="h-10 w-3/4 md:w-1/2 mx-auto md:mx-0" delay={0.1} />
          
          <div className="flex justify-center md:justify-start gap-3">
             <ShimmerBar className="h-6 w-16 rounded-full" delay={0.15} />
             <ShimmerBar className="h-6 w-16 rounded-full" delay={0.2} />
          </div>

          <ShimmerBar className="h-14 w-full rounded-full mt-6" delay={0.25} />
          
          <div className="flex gap-4 justify-center md:justify-start overflow-x-auto pb-2">
             <ShimmerBar className="h-12 w-12 rounded-full flex-shrink-0" delay={0.3} />
             <ShimmerBar className="h-12 w-12 rounded-full flex-shrink-0" delay={0.35} />
             <ShimmerBar className="h-12 w-28 rounded-full flex-shrink-0" delay={0.4} />
          </div>

          <div className="space-y-3 mt-8">
             <ShimmerBar className="h-4 w-full" delay={0.45} />
             <ShimmerBar className="h-4 w-11/12" delay={0.5} />
             <ShimmerBar className="h-4 w-4/5" delay={0.55} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function SeriesDetailSkeleton() {
  return (
    <div className="pb-24">
      {/* Backdrop skeleton */}
      <div className="relative -mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-6 md:h-96 md:aspect-auto aspect-[3/4] overflow-hidden bg-muted/20">
        <ShimmerBar className="w-full h-full rounded-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center md:items-start md:flex-row gap-6 md:px-4 mb-8">
        <div className="hidden md:block w-64 flex-shrink-0 z-10">
          <ShimmerBar className="aspect-[2/3] rounded-xl w-full relative -mt-32 border-4 border-background" />
        </div>
        
        <div className="flex-1 w-full space-y-5 text-center md:text-left z-10">
          <ShimmerBar className="h-10 w-3/4 md:w-1/2 mx-auto md:mx-0" delay={0.1} />
          
          <div className="flex justify-center md:justify-start gap-3">
             <ShimmerBar className="h-6 w-16 rounded-full" delay={0.15} />
             <ShimmerBar className="h-6 w-16 rounded-full" delay={0.2} />
          </div>

          <ShimmerBar className="h-14 w-full rounded-full mt-6" delay={0.25} />
          
          <div className="flex gap-4 justify-center md:justify-start overflow-x-auto pb-2">
             <ShimmerBar className="h-12 w-12 rounded-full flex-shrink-0" delay={0.3} />
             <ShimmerBar className="h-12 w-12 rounded-full flex-shrink-0" delay={0.35} />
             <ShimmerBar className="h-12 w-28 rounded-full flex-shrink-0" delay={0.4} />
          </div>

          <div className="space-y-3 mt-8">
             <ShimmerBar className="h-4 w-full" delay={0.45} />
             <ShimmerBar className="h-4 w-11/12" delay={0.5} />
          </div>
        </div>
      </motion.div>
      
      {/* Episodes Section */}
      <div className="px-4 md:px-6">
        <div className="flex gap-2 mb-6">
          <ShimmerBar className="h-9 w-28 rounded-lg" delay={0.6} />
          <ShimmerBar className="h-9 w-28 rounded-lg" delay={0.65} />
        </div>
        
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="flex gap-4 p-3 border border-border rounded-lg bg-card overflow-hidden">
                <ShimmerBar className="w-6 h-6 mt-2 rounded flex-shrink-0" delay={0.7 + i * 0.05} />
                <ShimmerBar className="w-28 aspect-video rounded-md flex-shrink-0" delay={0.75 + i * 0.05} />
                <div className="flex-1 space-y-2 pt-1 min-w-0">
                   <ShimmerBar className="h-5 w-2/3" delay={0.8 + i * 0.05} />
                   <ShimmerBar className="h-4 w-full max-w-sm" delay={0.85 + i * 0.05} />
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageLoadingSkeleton() {
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
