import { useState } from 'react';
import { Home, Tv, Film, Clapperboard, Heart, Clock, MoreHorizontal, Settings, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import amtechIcon from '@/assets/amtech-icon.png';
import GlobalSearch from '@/components/GlobalSearch';

const items = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/live', icon: Tv, label: 'TV ao Vivo' },
  { path: '/movies', icon: Film, label: 'Filmes' },
  { path: '/series', icon: Clapperboard, label: 'Séries' },
  { path: '/favorites', icon: Heart, label: 'Favoritos' },
  { path: '/history', icon: Clock, label: 'Histórico' },
  { path: '/settings', icon: Settings, label: 'Configurações' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      {/* Floating menu button - top right on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 right-3 z-40 md:hidden p-2.5 rounded-full bg-secondary/80 backdrop-blur-md border border-border/50 shadow-lg hover:bg-secondary transition-colors"
      >
        <MoreHorizontal className="w-5 h-5 text-foreground" />
      </button>

      {/* Overlay + Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-2xl bg-card border-t border-border shadow-2xl"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 pt-1">
                <div className="flex items-center gap-3">
                  <img src={amtechIcon} alt="AMTECH" className="w-8 h-8 rounded-lg" />
                  <span className="text-foreground font-bold text-base">Menu</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Navigation items */}
              <div className="px-3 pb-6 grid grid-cols-3 gap-2">
                {items.map(({ path, icon: Icon, label }) => {
                  const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
                  return (
                    <button
                      key={path}
                      onClick={() => handleNavigate(path)}
                      className={`flex flex-col items-center gap-2 py-4 px-2 rounded-xl transition-all ${
                        active
                          ? 'bg-primary/15 border border-primary/30'
                          : 'bg-muted/40 border border-transparent hover:bg-muted/70'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Safe area padding */}
              <div className="safe-area-bottom" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
