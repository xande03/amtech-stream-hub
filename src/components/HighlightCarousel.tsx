import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { posterImage, backdropImage, heroImage } from '@/lib/imageProxy';
import { Star, Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselItem {
  id: number;
  name: string;
  image: string;
  rating: string | number;
  type: 'movie' | 'series';
  rank?: number;
  genre?: string;
  plot?: string;
}

interface HighlightCarouselProps {
  items: CarouselItem[];
}

export default function HighlightCarousel({ items }: HighlightCarouselProps) {
  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const dragX = useMotionValue(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const onDragEnd = () => {
    const x = dragX.get();
    if (x <= -50 && index < items.length - 1) {
      setIndex(i => i + 1);
    } else if (x >= 50 && index > 0) {
      setIndex(i => i - 1);
    }
  };

  const next = () => setIndex(i => (i + 1) % items.length);
  const prev = () => setIndex(i => (i - 1 + items.length) % items.length);

  // Auto-rotate on desktop hero
  useEffect(() => {
    if (isMobile || items.length <= 1) return;
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [isMobile, items.length]);

  if (!items.length) return null;

  if (isMobile) {
    return (
      <div className="relative w-full overflow-hidden py-4 min-h-[460px]">
        <div className="flex items-center justify-center min-h-[400px]">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x: dragX }}
            onDragEnd={onDragEnd}
            className="flex items-center justify-center cursor-grab active:cursor-grabbing w-full relative h-[400px]"
          >
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => {
                const isActive = i === index;
                const isPrev = i === index - 1;
                const isNext = i === index + 1;
                
                if (!isActive && !isPrev && !isNext) return null;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ scale: 0.85, opacity: 0, x: (i - index) * 180 }}
                    animate={{ 
                      scale: isActive ? 1.1 : 0.85, 
                      opacity: isActive ? 1 : 0.4,
                      x: (i - index) * (isActive ? 0 : (i < index ? -180 : 180)),
                      zIndex: isActive ? 20 : 10,
                      filter: isActive ? 'blur(0px)' : 'blur(1.5px)'
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={() => isActive && navigate(item.type === 'movie' ? `/movies/${item.id}` : `/series/${item.id}`)}
                    className="absolute w-[240px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/5 bg-secondary"
                  >
                    <img
                      src={posterImage(item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Rank Badge */}
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center justify-center min-w-[36px]">
                      <span className="text-white font-black text-xl italic leading-none">{i + 1}</span>
                    </div>

                    {/* Star Rating on card */}
                    <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1 px-4 text-center">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} className={`w-3.5 h-3.5 ${star <= Math.round(Number(item.rating)/2) ? 'fill-yellow-500 text-yellow-500' : 'text-white/20'}`} />
                        ))}
                      </div>
                      <span className="text-white text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70 truncate w-full">{item.name}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`transition-all duration-300 rounded-full h-2 ${i === index ? 'w-6 bg-yellow-500' : 'w-2 bg-white/20'}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop Elegant Layout (Netflix Style Banner)
  const current = items[index];
  return (
    <div className="relative rounded-2xl overflow-hidden group shadow-2xl border border-white/5 bg-black h-[450px] lg:h-[550px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={heroImage(current.image)}
            alt={current.name}
            className="w-full h-full object-cover brightness-75 scale-105 group-hover:scale-100 transition-transform duration-[10s]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-y-0 left-0 w-full md:w-2/3 lg:w-1/2 flex flex-col justify-center px-8 md:px-12 lg:px-20 z-10 space-y-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          key={`meta-${current.id}`}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-widest">
              Top {index + 1} Hoje
            </span>
            <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
              <Star className="w-3 h-3 fill-yellow-500" />
              <span className="text-xs font-bold">{current.rating}</span>
            </div>
            {current.genre && (
              <span className="text-white/60 text-xs font-medium">{current.genre.split(',')[0]}</span>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white uppercase tracking-tight leading-none drop-shadow-2xl">
            {current.name}
          </h1>
          
          <p className="text-white/70 text-sm md:text-base lg:text-lg max-w-md line-clamp-3 font-medium leading-relaxed drop-shadow-lg">
            {current.plot || "Uma produção exclusiva Xerife Player. Assista agora em alta definição."}
          </p>

          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={() => navigate(current.type === 'movie' ? `/movies/${current.id}` : `/series/${current.id}`)}
              className="flex items-center gap-3 px-8 py-3.5 rounded-full bg-white text-black font-black uppercase tracking-wider hover:bg-yellow-500 hover:text-black transition-all shadow-xl active:scale-95"
            >
              <Play className="w-5 h-5 fill-black" /> Assistir
            </button>
            <button
              onClick={() => navigate(current.type === 'movie' ? `/movies/${current.id}` : `/series/${current.id}`)}
              className="flex items-center gap-3 px-6 py-3.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold uppercase tracking-wider hover:bg-white/20 transition-all shadow-lg active:scale-95"
            >
              <Info className="w-5 h-5" /> Mais Info
            </button>
          </div>
        </motion.div>
      </div>

      {/* Nav Buttons Desktop */}
      <div className="absolute right-8 bottom-8 z-20 flex gap-3">
        <button onClick={prev} className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all active:scale-90">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={next} className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all active:scale-90">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Pagination Tiles Desktop */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3 z-10">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setIndex(i)}
            className={`w-1.5 h-12 rounded-full transition-all duration-500 ${i === index ? 'bg-yellow-500 scale-y-110 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}
