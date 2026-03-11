import { Home, Tv, Film, Clapperboard, Heart, Clock, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Home', subtitle: 'Início', url: '/', icon: Home, color: 'from-orange-500 to-amber-400' },
  { title: 'TV ao Vivo', subtitle: 'Canais', url: '/live', icon: Tv, color: 'from-indigo-500 to-blue-500' },
  { title: 'Filmes', subtitle: 'Catálogo', url: '/movies', icon: Film, color: 'from-rose-500 to-pink-500' },
  { title: 'Séries', subtitle: 'Episódios', url: '/series', icon: Clapperboard, color: 'from-violet-500 to-purple-500' },
  { title: 'Favoritos', subtitle: 'Seus favoritos', url: '/favorites', icon: Heart, color: 'from-red-500 to-rose-400' },
  { title: 'Histórico', subtitle: 'Assistidos', url: '/history', icon: Clock, color: 'from-emerald-500 to-green-400' },
  { title: 'Configurações', subtitle: 'Ajustes', url: '/settings', icon: Settings, color: 'from-slate-500 to-gray-400' },
];

export default function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { playlistName } = useAuth();
  const { favorites } = useFavorites();
  const { history } = useWatchHistory();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className={`p-5 ${collapsed ? 'px-2 py-4' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
              <Tv className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold tracking-tight text-foreground">AMTECH</h1>
                <p className="text-[11px] text-muted-foreground font-medium tracking-widest uppercase">Player</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {navItems.map((item) => {
                const badge = item.url === '/favorites' ? favorites.length
                  : item.url === '/history' ? history.length
                  : 0;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-auto p-0">
                      <NavLink
                        to={item.url}
                        end={item.url === '/'}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-sidebar-accent/60 group"
                        activeClassName="bg-sidebar-accent shadow-sm"
                      >
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-md transition-transform group-hover:scale-105`}>
                          <item.icon className="w-[18px] h-[18px] text-white" />
                        </div>
                        {!collapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-sidebar-foreground">{item.title}</span>
                              {badge > 0 && (
                                <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                                  {badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && playlistName && (
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent/40">
            <p className="text-[11px] text-muted-foreground truncate">📡 {playlistName}</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
