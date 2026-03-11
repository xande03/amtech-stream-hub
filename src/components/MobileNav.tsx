import { Home, Tv, Film, Clapperboard, Heart, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const items = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/live', icon: Tv, label: 'TV' },
  { path: '/movies', icon: Film, label: 'Filmes' },
  { path: '/series', icon: Clapperboard, label: 'Séries' },
  { path: '/favorites', icon: Heart, label: 'Favoritos' },
  { path: '/history', icon: Clock, label: 'Histórico' },
];

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {items.map(({ path, icon: Icon, label }) => {
          const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative"
            >
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] transition-colors ${active ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
