import { useState } from 'react';
import { Home, Tv, Film, Clapperboard, Heart, Clock, MoreHorizontal, Settings, X, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import amtechIcon from '@/assets/amtech-icon.png';
import GlobalSearch from '@/components/GlobalSearch';

const items = [
  { path: '/', icon: Home, label: 'Início', color: 'from-indigo-500 to-violet-600', glow: 'shadow-indigo-500/25' },
  { path: '/live', icon: Tv, label: 'TV ao Vivo', color: 'from-rose-500 to-pink-600', glow: 'shadow-rose-500/25' },
  { path: '/movies', icon: Film, label: 'Filmes', color: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/25' },
  { path: '/series', icon: Clapperboard, label: 'Séries', color: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/25' },
  { path: '/favorites', icon: Heart, label: 'Favoritos', color: 'from-pink-500 to-rose-600', glow: 'shadow-pink-500/25' },
  { path: '/history', icon: Clock, label: 'Histórico', color: 'from-sky-500 to-blue-600', glow: 'shadow-sky-500/25' },
  { path: '/finder', icon: Sparkles, label: 'Encontrar', color: 'from-fuchsia-500 to-purple-600', glow: 'shadow-fuchsia-500/25' },
  { path: '/settings', icon: Settings, label: 'Configurações', color: 'from-slate-400 to-slate-600', glow: 'shadow-slate-500/25' },
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
      {/* Floating buttons - top right on mobile */}
      <div className="fixed top-3 right-3 z-40 md:hidden flex items-center gap-2">
        <GlobalSearch />
        <button
          onClick={() => setOpen(true)}
          className="p-2.5 rounded-full bg-secondary/80 backdrop-blur-md border border-border/50 shadow-lg hover:bg-secondary transition-colors"
        >
          <MoreHorizontal className="w-5 h-5 text-foreground" />
        </button>
      </div>

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
                  <img src={amtechIcon} alt="Xerife Player" className="w-8 h-8 rounded-lg" />
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
              <div className="px-3 pb-6 grid grid-cols-3 gap-2.5">
                {items.map(({ path, icon: Icon, label, color, glow }, i) => {
                  const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
                  return (
                    <motion.button
                      key={path}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => handleNavigate(path)}
                      className={`group relative flex flex-col items-center gap-2.5 py-5 px-2 rounded-2xl transition-all duration-200 ${
                        active
                          ? `bg-gradient-to-br ${color} shadow-lg ${glow}`
                          : 'bg-muted/30 border border-border/40 hover:bg-muted/60 hover:border-border/70 hover:shadow-md'
                      }`}
                    >
                      <Icon className={`w-6 h-6 transition-colors ${
                        active ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                      }`} />
                      <span className={`text-[11px] font-semibold leading-tight text-center transition-colors ${
                        active ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                      }`}>
                        {label}
                      </span>
                    </motion.button>
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
