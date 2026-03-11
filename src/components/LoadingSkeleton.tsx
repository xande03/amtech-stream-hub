import { motion } from 'framer-motion';

function ShimmerBar({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay }}
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

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <ShimmerBar className="aspect-[2/3] w-full rounded-xl" delay={i * 0.05} />
          <ShimmerBar className="h-3 w-3/4" delay={i * 0.05 + 0.1} />
        </div>
      ))}
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
