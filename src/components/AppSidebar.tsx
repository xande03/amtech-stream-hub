import { Home, Tv, Film, Clapperboard, Heart, Clock, Settings, Sparkles, CalendarClock } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import amtechIcon from '@/assets/amtech-icon.png';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { title: 'Home', subtitle: 'Início', url: '/', icon: Home, color: 'from-orange-500 to-amber-400' },
  { title: 'TV ao Vivo', subtitle: 'Canais', url: '/live', icon: Tv, color: 'from-indigo-500 to-blue-500' },
  { title: 'Filmes', subtitle: 'Catálogo', url: '/movies', icon: Film, color: 'from-rose-500 to-pink-500' },
  { title: 'Séries', subtitle: 'Episódios', url: '/series', icon: Clapperboard, color: 'from-violet-500 to-purple-500' },
  { title: 'Favoritos', subtitle: 'Seus favoritos', url: '/favorites', icon: Heart, color: 'from-red-500 to-rose-400', badgeKey: 'favorites' as const },
  { title: 'Histórico', subtitle: 'Assistidos', url: '/history', icon: Clock, color: 'from-emerald-500 to-green-400', badgeKey: 'history' as const },
  { title: 'Encontrar Filme', subtitle: 'IA Assistente', url: '/finder', icon: Sparkles, color: 'from-amber-500 to-orange-500' },
  { title: 'Configurações', subtitle: 'Ajustes', url: '/settings', icon: Settings, color: 'from-slate-500 to-gray-400' },
];

export default function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { playlistName } = useAuth();
  const { favorites } = useFavorites();
  const { history } = useWatchHistory();

  const badgeCounts = {
    favorites: favorites.length,
    history: history.length,
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center py-4 px-1' : 'gap-3 p-5'}`}>
          <img src={amtechIcon} alt="Xerife Player" className={`rounded-xl flex-shrink-0 shadow-lg shadow-primary/20 ${collapsed ? 'w-8 h-8' : 'w-11 h-11'}`} />
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">XERIFE</h1>
              <p className="text-[11px] text-muted-foreground font-medium tracking-widest uppercase">Player</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className={`space-y-1 ${collapsed ? 'px-1' : 'px-2'}`}>
              {navItems.map((item) => {
                const badge = item.badgeKey ? badgeCounts[item.badgeKey] : 0;

                const linkContent = (
                  <NavLink
                    to={item.url}
                    end={item.url === '/'}
                    className={`flex items-center rounded-xl transition-all duration-200 hover:bg-sidebar-accent/60 group ${collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'}`}
                    activeClassName="bg-sidebar-accent shadow-sm"
                  >
                    <div className={`rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-md transition-transform group-hover:scale-105 ${collapsed ? 'w-7 h-7' : 'w-9 h-9'}`}>
                      <item.icon className={`text-white ${collapsed ? 'w-3.5 h-3.5' : 'w-[18px] h-[18px]'}`} />
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
                );

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-auto p-0">
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {linkContent}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            {item.title}
                            {badge > 0 && <span className="ml-1.5 text-primary">({badge})</span>}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        linkContent
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && playlistName && (
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent/40">
            <p className="text-[11px] text-muted-foreground truncate">📡 {playlistName}</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
