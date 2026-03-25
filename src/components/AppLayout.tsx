import { ReactNode, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import MobileNav from '@/components/MobileNav';
import GlobalSearch from '@/components/GlobalSearch';
import PageTransition from '@/components/PageTransition';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Menu, Cast } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    // Add Cast script globally if not already present
    if (!document.getElementById('cast-api')) {
      const script = document.createElement('script');
      script.id = 'cast-api';
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      document.body.appendChild(script);
    }
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <header className="h-16 flex md:hidden items-center justify-between px-4 sticky top-0 z-40 bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-2">
              {/* Cast button using generic launcher */}
              <button 
                className="p-2.5 rounded-full hover:bg-secondary text-foreground transition-colors"
                onClick={() => {
                  if (window.cast?.framework) {
                    window.cast.framework.CastContext.getInstance().requestSession();
                  }
                }}
              >
                <Cast className="w-5 h-5" />
              </button>
            </div>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5 overflow-hidden">
              <span className="text-primary italic">XERIFE</span>
              <span className="text-foreground opacity-60">HUB</span>
            </h1>
            <GlobalSearch />
          </header>

          <header className="h-12 hidden md:flex items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-foreground" />
              <button 
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ml-2"
                title="Transmitir para TV"
                onClick={() => {
                  if (window.cast?.framework) {
                    window.cast.framework.CastContext.getInstance().requestSession();
                  }
                }}
              >
                <Cast className="w-5 h-5" />
              </button>
            </div>
            <GlobalSearch />
          </header>
          <main className="flex-1 overflow-auto p-3 md:p-6 pb-24 md:pb-6">
            {children}
          </main>
        </div>
        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}
