import { Home, Tv, Film, Clapperboard, Heart, Clock, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
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
  { title: 'Home', url: '/', icon: Home },
  { title: 'TV ao Vivo', url: '/live', icon: Tv },
  { title: 'Filmes', url: '/movies', icon: Film },
  { title: 'Séries', url: '/series', icon: Clapperboard },
  { title: 'Favoritos', url: '/favorites', icon: Heart },
  { title: 'Histórico', url: '/history', icon: Clock },
  { title: 'Configurações', url: '/settings', icon: Settings },
];

export default function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { playlistName } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`p-4 ${collapsed ? 'px-2' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Tv className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-sm font-bold text-foreground">AMTECH</h1>
                <p className="text-[10px] text-muted-foreground">PLAYER</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === '/'} className="hover:bg-sidebar-accent/50 transition-colors" activeClassName="bg-sidebar-accent text-primary font-medium">
                      <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && playlistName && (
          <div className="px-2 py-1">
            <p className="text-xs text-muted-foreground truncate">📡 {playlistName}</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
