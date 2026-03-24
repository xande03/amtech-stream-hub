import { useState } from 'react';
import { Home, Tv, Film, Clapperboard, Heart, Clock, MoreHorizontal, Settings, X, Sparkles, Download, Moon, Sun } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from "next-themes";
import amtechIcon from '@/assets/amtech-icon.png';
import GlobalSearch from '@/components/GlobalSearch';

const mainItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/live', icon: Tv, label: 'TV ao vivo' },
  { path: '/series', icon: Clapperboard, label: 'Séries' },
  { path: '/movies', icon: Film, label: 'Filmes' },
];

const secondaryItems = [
  { path: '/favorites', icon: Heart, label: 'Favoritos', color: 'from-pink-500 to-rose-600', glow: 'shadow-pink-500/25' },
  { path: '/history', icon: Clock, label: 'Histórico', color: 'from-sky-500 to-blue-600', glow: 'shadow-sky-500/25' },
  { path: '/downloads', icon: Download, label: 'Downloads', color: 'from-cyan-500 to-sky-600', glow: 'shadow-cyan-500/25' },
  { path: '/finder', icon: Sparkles, label: 'Encontrar', color: 'from-fuchsia-500 to-purple-600', glow: 'shadow-fuchsia-500/25' },
  { path: '/settings', icon: Settings, label: 'Configurações', color: 'from-slate-400 to-slate-600', glow: 'shadow-slate-500/25' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>


      {/* Footer Navigation Bar - Pill style */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 md:hidden w-[95%] max-w-md">
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-[2.5rem] px-2 py-2 flex items-center justify-around shadow-2xl overflow-hidden">
          {mainItems.map((item) => {
            const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`relative flex flex-col items-center gap-1 py-2 px-4 transition-all duration-300 group ${active ? 'text-[#ff5c35] scale-105' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {active && (
                  <motion.div
                    layoutId="activeNavHighlight"
                    className="absolute inset-0 bg-white/5 rounded-[2rem] -z-10"
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                  />
                )}
                <item.icon className={`w-6 h-6 transition-colors ${active ? 'text-[#ff5c35]' : 'text-muted-foreground group-hover:text-foreground'}`} />
                <span className={`text-[10px] font-bold transition-colors ${active ? 'text-[#ff5c35]' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
                {active && (
                  <motion.div 
                    layoutId="activeUnderline"
                    className="absolute -bottom-1 w-1 h-1 bg-[#ff5c35] rounded-full" 
                  />
                )}
              </button>
            );
          })}
          
          {/* More button to open drawer */}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-1 py-2 px-4 text-muted-foreground hover:text-foreground transition-all group"
          >
            <MoreHorizontal className="w-6 h-6 text-muted-foreground group-hover:text-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground">Mais</span>
          </button>
        </div>
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
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-[2.5rem] bg-card border-t border-border shadow-2xl overflow-hidden"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-muted" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4 pt-2">
                <div className="flex items-center gap-3">
                  <img src={amtechIcon} alt="Xerife Player" className="w-8 h-8 rounded-xl shadow-lg" />
                  <span className="text-foreground font-black text-lg tracking-tight">Ferramentas</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Navigation items (Secondary) */}
              <div className="px-4 pb-10 grid grid-cols-3 gap-3">
                {secondaryItems.map(({ path, icon: Icon, label, color, glow }, i) => {
                  const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
                  return (
                    <motion.button
                      key={path}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                      onClick={() => handleNavigate(path)}
                      className={`group relative flex flex-col items-center gap-3 py-5 px-2 rounded-2xl transition-all duration-300 ${
                        active
                          ? `bg-gradient-to-br ${color} shadow-lg ${glow}`
                          : 'bg-secondary border border-border/50 hover:bg-secondary/80 hover:border-border'
                      }`}
                    >
                      <Icon className={`w-6 h-6 transition-all duration-300 ${
                        active ? 'text-white scale-110' : 'text-muted-foreground group-hover:text-foreground'
                      }`} />
                      <span className={`text-[12px] font-bold leading-tight text-center transition-colors ${
                        active ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                      }`}>
                        {label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Safe area padding */}
              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
