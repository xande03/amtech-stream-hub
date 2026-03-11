import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import MobileNav from '@/components/MobileNav';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 hidden md:flex items-center border-b border-border px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
            <SidebarTrigger className="text-foreground" />
          </header>
          <main className="flex-1 overflow-auto p-3 md:p-6 pb-6">
            {children}
          </main>
        </div>
        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}
