import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import MobileNav from '@/components/MobileNav';
import GlobalSearch from '@/components/GlobalSearch';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
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
            <div className="w-10 md:hidden" /> {/* Spacer instead of sidebar trigger */}
            <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5 overflow-hidden">
              <span className="text-primary italic">XERIFE</span>
              <span className="text-foreground opacity-60">PLAYER</span>
            </h1>
            <GlobalSearch />
          </header>

          <header className="h-12 hidden md:flex items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
            <SidebarTrigger className="text-foreground" />
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
