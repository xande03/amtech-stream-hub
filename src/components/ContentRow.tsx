import { ReactNode, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DraggableScroll from '@/components/DraggableScroll';

interface ContentRowProps {
  title: string;
  children: ReactNode;
  onViewAll?: () => void;
}

export default function ContentRow({ title, children, onViewAll }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current?.querySelector('[data-draggable-scroll]') as HTMLDivElement | null;
    if (el) {
      const amount = el.clientWidth * 0.75;
      el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {onViewAll && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewAll(); }}
            className="text-sm text-primary hover:underline z-20 relative"
          >
            Ver todos
          </button>
        )}
      </div>
      <div className="relative group" ref={scrollRef}>
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <DraggableScroll className="gap-3 pb-2 px-1" data-draggable-scroll>
          {children}
        </DraggableScroll>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-6 h-6 text-foreground" />
        </button>
      </div>
    </div>
  );
}
