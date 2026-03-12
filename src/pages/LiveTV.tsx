import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getLiveStreams, getLiveCategories, checkChannelsStatus, LiveStream, Category } from '@/services/xtreamApi';
import { useFavorites } from '@/hooks/useFavorites';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { Input } from '@/components/ui/input';
import { Search, Tv, Heart, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { LiveTVSkeleton } from '@/components/LoadingSkeleton';
import DraggableScroll from '@/components/DraggableScroll';

const PAGE_SIZE = 60;
const CHECK_BATCH_SIZE = 30;

export default function LiveTV() {
  const { accessCode } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToHistory } = useWatchHistory();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [channelStatus, setChannelStatus] = useState<Record<number, boolean>>({});
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');

  useEffect(() => {
    if (!accessCode) return;
    setLoading(true);
    Promise.all([
      getLiveStreams(accessCode).catch(() => []),
      getLiveCategories(accessCode).catch(() => []),
    ]).then(([s, c]) => {
      setStreams(s);
      setCategories(c);
    }).finally(() => setLoading(false));
  }, [accessCode]);

  // Check channel status for currently filtered channels
  const checkStatus = useCallback(async (channelsToCheck: LiveStream[]) => {
    if (!accessCode || channelsToCheck.length === 0) return;
    setCheckingStatus(true);
    try {
      // Check in batches
      const ids = channelsToCheck.map(c => c.stream_id);
      for (let i = 0; i < ids.length; i += CHECK_BATCH_SIZE) {
        const batch = ids.slice(i, i + CHECK_BATCH_SIZE);
        const results = await checkChannelsStatus(accessCode, batch);
        setChannelStatus(prev => ({ ...prev, ...results }));
      }
    } catch (e) {
      console.error('Failed to check channel status:', e);
    } finally {
      setCheckingStatus(false);
    }
  }, [accessCode]);

  // Auto-check when category changes
  useEffect(() => {
    if (!streams.length || loading) return;
    const toCheck = selectedCategory === 'all'
      ? streams.slice(0, CHECK_BATCH_SIZE)
      : streams.filter(s => s.category_id === selectedCategory).slice(0, CHECK_BATCH_SIZE * 2);
    
    // Only check channels we haven't checked yet
    const unchecked = toCheck.filter(s => channelStatus[s.stream_id] === undefined);
    if (unchecked.length > 0) {
      checkStatus(unchecked);
    }
  }, [selectedCategory, streams, loading]);

  // Reset visible count when filter changes
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedCategory, search, statusFilter]);

  const filtered = useMemo(() => {
    let result = streams;
    if (selectedCategory !== 'all') result = result.filter(s => s.category_id === selectedCategory);
    if (search) { const q = search.toLowerCase(); result = result.filter(s => s.name.toLowerCase().includes(q)); }
    
    // Sort: online channels first
    result = [...result].sort((a, b) => {
      const aOnline = channelStatus[a.stream_id] === true ? 1 : channelStatus[a.stream_id] === false ? -1 : 0;
      const bOnline = channelStatus[b.stream_id] === true ? 1 : channelStatus[b.stream_id] === false ? -1 : 0;
      return bOnline - aOnline;
    });

    // Apply status filter
    if (statusFilter === 'online') result = result.filter(s => channelStatus[s.stream_id] === true);
    if (statusFilter === 'offline') result = result.filter(s => channelStatus[s.stream_id] === false);
    
    return result;
  }, [streams, selectedCategory, search, channelStatus, statusFilter]);

  const visible = filtered.slice(0, visibleCount);

  // Count online/offline for current category
  const statusCounts = useMemo(() => {
    let inCategory = streams;
    if (selectedCategory !== 'all') inCategory = inCategory.filter(s => s.category_id === selectedCategory);
    const online = inCategory.filter(s => channelStatus[s.stream_id] === true).length;
    const offline = inCategory.filter(s => channelStatus[s.stream_id] === false).length;
    const unknown = inCategory.length - online - offline;
    return { online, offline, unknown, total: inCategory.length };
  }, [streams, selectedCategory, channelStatus]);

  const StatusIndicator = ({ streamId }: { streamId: number }) => {
    const status = channelStatus[streamId];
    if (status === undefined) return null;
    return (
      <div className={`w-2.5 h-2.5 rounded-full ${status ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-destructive/60'}`} 
        title={status ? 'Online' : 'Offline'} />
    );
  };

  if (loading) return <LiveTVSkeleton />;

  return (
    <div className="pt-12 md:pt-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">TV ao Vivo</h1>
        <div className="flex items-center gap-2">
          {/* Status summary */}
          {(statusCounts.online > 0 || statusCounts.offline > 0) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3 text-green-500" /> {statusCounts.online}
              </span>
              <span className="flex items-center gap-1">
                <WifiOff className="w-3 h-3 text-destructive" /> {statusCounts.offline}
              </span>
          </div>
          )}
          <button
            onClick={() => {
              const inCategory = selectedCategory === 'all' ? streams : streams.filter(s => s.category_id === selectedCategory);
              // Clear existing status for this category to force re-check
              const idsToReset = inCategory.map(s => s.stream_id);
              setChannelStatus(prev => {
                const next = { ...prev };
                idsToReset.forEach(id => delete next[id]);
                return next;
              });
              checkStatus(inCategory.slice(0, CHECK_BATCH_SIZE * 2));
            }}
            disabled={checkingStatus}
            className="p-1.5 rounded-md bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
            title="Re-verificar status dos canais"
          >
            <Loader2 className={`w-4 h-4 text-primary ${checkingStatus ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
            <button onClick={() => setViewMode('grid')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Grid</button>
            <button onClick={() => setViewMode('list')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Lista</button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-2 items-center">
          <div className="relative max-w-lg w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Buscar canais..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 h-12 text-base bg-secondary border-border text-foreground rounded-xl" />
          </div>
          {/* Status filter buttons */}
          <div className="flex gap-1 bg-secondary rounded-lg p-0.5 flex-shrink-0">
            <button onClick={() => setStatusFilter('all')} className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Todos</button>
            <button onClick={() => setStatusFilter('online')} className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${statusFilter === 'online' ? 'bg-green-600 text-white' : 'text-muted-foreground'}`}>
              <Wifi className="w-3 h-3" /> Online
            </button>
            <button onClick={() => setStatusFilter('offline')} className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${statusFilter === 'offline' ? 'bg-destructive text-destructive-foreground' : 'text-muted-foreground'}`}>
              <WifiOff className="w-3 h-3" /> Offline
            </button>
          </div>
        </div>

        <DraggableScroll>
          <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>Todos</button>
          {categories.map(cat => (
            <button key={cat.category_id} onClick={() => setSelectedCategory(cat.category_id)} className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${selectedCategory === cat.category_id ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{cat.category_name}</button>
          ))}
        </DraggableScroll>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {visible.map((ch, i) => {
            const isOnline = channelStatus[ch.stream_id] === true;
            const isOffline = channelStatus[ch.stream_id] === false;
            return (
              <motion.div key={ch.stream_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}
                onClick={() => { addToHistory({ id: ch.stream_id, type: 'live', name: ch.name, icon: ch.stream_icon }); window.open(`/player/live/${ch.stream_id}`, '_blank'); }}
                className={`group cursor-pointer bg-card rounded-lg p-3 border transition-all relative ${isOnline ? 'border-green-500/40 hover:border-green-500/70 hover:shadow-[0_0_12px_rgba(34,197,94,0.15)]' : isOffline ? 'border-border opacity-50' : 'border-border hover:border-primary/50 hover:shadow-glow'}`}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite({ id: ch.stream_id, type: 'live', name: ch.name, icon: ch.stream_icon }); }}
                  className="absolute top-2 right-2 z-10 p-1 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorite(ch.stream_id, 'live') ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                </button>
                {/* Status indicator */}
                <div className="absolute top-2 left-2 z-10">
                  <StatusIndicator streamId={ch.stream_id} />
                </div>
                <div className="w-full aspect-square rounded-md overflow-hidden bg-secondary mb-2 flex items-center justify-center">
                  {ch.stream_icon ? (
                    <img src={ch.stream_icon} alt={ch.name} className="w-full h-full object-contain p-2" loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (<Tv className="w-8 h-8 text-muted-foreground" />)}
                </div>
                <p className="text-sm text-foreground font-medium truncate">{ch.name}</p>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((ch, i) => {
            const isOnline = channelStatus[ch.stream_id] === true;
            const isOffline = channelStatus[ch.stream_id] === false;
            return (
              <motion.div key={ch.stream_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.015, 0.4) }}
                onClick={() => { addToHistory({ id: ch.stream_id, type: 'live', name: ch.name, icon: ch.stream_icon }); window.open(`/player/live/${ch.stream_id}`, '_blank'); }}
                className={`group cursor-pointer bg-card rounded-lg p-3 border transition-all flex items-center gap-3 ${isOnline ? 'border-green-500/40 hover:border-green-500/70' : isOffline ? 'border-border opacity-50' : 'border-border hover:border-primary/50 hover:shadow-glow'}`}>
                <StatusIndicator streamId={ch.stream_id} />
                <div className="w-12 h-12 rounded-md overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                  {ch.stream_icon ? (
                    <img src={ch.stream_icon} alt={ch.name} className="w-full h-full object-contain p-1" loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (<Tv className="w-5 h-5 text-muted-foreground" />)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{ch.name}</p>
                  {channelStatus[ch.stream_id] !== undefined && (
                    <p className={`text-[10px] ${isOnline ? 'text-green-500' : 'text-destructive'}`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite({ id: ch.stream_id, type: 'live', name: ch.name, icon: ch.stream_icon }); }}
                  className="p-1.5 rounded-full hover:bg-secondary transition-colors"
                >
                  <Heart className={`w-4 h-4 ${isFavorite(ch.stream_id, 'live') ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {visibleCount < filtered.length && (
        <div className="flex justify-center mt-6">
          <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
            Carregar mais ({filtered.length - visibleCount} restantes)
          </button>
        </div>
      )}

      {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">Nenhum canal encontrado.</div>}
    </div>
  );
}
