import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getLiveStreams, getLiveCategories, getShortEpg, LiveStream, Category, EpgEntry } from '@/services/xtreamApi';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { Input } from '@/components/ui/input';
import { Search, Tv, Clock, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import DraggableScroll from '@/components/DraggableScroll';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_WIDTH = 200; // px per hour
const CHANNEL_COL = 180;

function formatTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function parseEpgTime(ts: string | number): Date {
  if (typeof ts === 'number') return new Date(ts * 1000);
  return new Date(ts);
}

interface ChannelEpg {
  stream: LiveStream;
  entries: EpgEntry[];
}

export default function EpgGuide() {
  const { accessCode } = useAuth();
  const { addToHistory } = useWatchHistory();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [epgData, setEpgData] = useState<Map<number, EpgEntry[]>>(new Map());
  const [loadingEpg, setLoadingEpg] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const gridRef = useRef<HTMLDivElement>(null);
  const now = new Date();

  // Load streams & categories
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

  // Filter streams
  const filtered = useMemo(() => {
    let result = streams;
    if (selectedCategory !== 'all') result = result.filter(s => s.category_id === selectedCategory);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }
    return result.slice(0, 50); // Limit for EPG loading
  }, [streams, selectedCategory, search]);

  // Load EPG for visible channels
  useEffect(() => {
    if (!accessCode || filtered.length === 0) return;
    setLoadingEpg(true);
    const promises = filtered.map(stream =>
      getShortEpg(accessCode, stream.stream_id, 10)
        .then(entries => ({ streamId: stream.stream_id, entries }))
        .catch(() => ({ streamId: stream.stream_id, entries: [] as EpgEntry[] }))
    );

    Promise.all(promises).then(results => {
      const map = new Map<number, EpgEntry[]>();
      results.forEach(r => map.set(r.streamId, r.entries));
      setEpgData(map);
    }).finally(() => setLoadingEpg(false));
  }, [accessCode, filtered]);

  // Scroll to current time on load
  useEffect(() => {
    if (gridRef.current && !loading) {
      const nowHour = now.getHours() + now.getMinutes() / 60;
      const scrollPos = nowHour * HOUR_WIDTH - 100;
      gridRef.current.scrollLeft = Math.max(0, scrollPos);
    }
  }, [loading, loadingEpg]);

  const dayStart = currentDate.getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;

  const navigateDay = (offset: number) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + offset);
      return d;
    });
  };

  const isToday = currentDate.toDateString() === new Date().toDateString();

  if (loading) {
    return (
      <div className="pt-12 md:pt-0 space-y-4">
        <div className="h-8 w-48 bg-secondary rounded animate-pulse" />
        <div className="h-12 w-full max-w-lg bg-secondary rounded-xl animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-12 md:pt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Guia de Programação</h1>
        </div>
        <div className="flex items-center gap-1.5 bg-secondary rounded-lg p-1">
          <button
            onClick={() => navigateDay(-1)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-foreground px-2 min-w-[100px] text-center">
            {isToday ? 'Hoje' : currentDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
          </span>
          <button
            onClick={() => navigateDay(1)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="relative max-w-lg w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar canais..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 h-11 text-base bg-secondary border-border text-foreground rounded-xl"
          />
        </div>
        <DraggableScroll>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategory(cat.category_id)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === cat.category_id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.category_name}
            </button>
          ))}
        </DraggableScroll>
      </div>

      {/* Current time indicator */}
      {isToday && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs font-medium text-destructive">{formatTime(now)}</span>
          <span className="text-xs text-muted-foreground">— agora</span>
        </div>
      )}

      {/* EPG Grid */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="overflow-x-auto" ref={gridRef}>
          <div style={{ minWidth: CHANNEL_COL + HOUR_WIDTH * 24 }}>
            {/* Timeline header */}
            <div className="flex sticky top-0 z-10 bg-secondary/90 backdrop-blur-sm border-b border-border">
              <div
                className="flex-shrink-0 flex items-center justify-center border-r border-border px-3 py-2"
                style={{ width: CHANNEL_COL }}
              >
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Canal</span>
              </div>
              <div className="flex">
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="flex-shrink-0 flex items-center px-3 py-2 border-r border-border/50"
                    style={{ width: HOUR_WIDTH }}
                  >
                    <span className="text-xs font-semibold text-muted-foreground">
                      {String(h).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Channel rows */}
            {filtered.map((stream, idx) => {
              const entries = epgData.get(stream.stream_id) || [];
              return (
                <motion.div
                  key={stream.stream_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                  className="flex border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  {/* Channel info - clickable */}
                  <div
                    onClick={() => {
                      addToHistory({ id: stream.stream_id, type: 'live', name: stream.name, icon: stream.stream_icon });
                      window.open(`/player/live/${stream.stream_id}`, '_blank');
                    }}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-r border-border bg-card sticky left-0 z-[5] cursor-pointer hover:bg-muted/40 transition-colors group/ch"
                    style={{ width: CHANNEL_COL }}
                    title={`Assistir ${stream.name}`}
                  >
                    <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                      {stream.stream_icon ? (
                        <img
                          src={stream.stream_icon}
                          alt={stream.name}
                          className="w-full h-full object-contain p-0.5"
                          loading="lazy"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <Tv className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 bg-primary/60 flex items-center justify-center rounded opacity-0 group-hover/ch:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-foreground truncate group-hover/ch:text-primary transition-colors">{stream.name}</span>
                  </div>

                  {/* Programs timeline */}
                  <div className="relative flex-1" style={{ height: 48 }}>
                    {entries.length > 0 ? entries.map((entry, eIdx) => {
                      const start = parseEpgTime(entry.start_timestamp || entry.start);
                      const end = parseEpgTime(entry.stop_timestamp || entry.end);
                      const startMs = Math.max(start.getTime(), dayStart);
                      const endMs = Math.min(end.getTime(), dayEnd);
                      if (endMs <= dayStart || startMs >= dayEnd) return null;

                      const leftPx = ((startMs - dayStart) / (1000 * 60 * 60)) * HOUR_WIDTH;
                      const widthPx = Math.max(((endMs - startMs) / (1000 * 60 * 60)) * HOUR_WIDTH, 30);

                      const isNow = now.getTime() >= start.getTime() && now.getTime() < end.getTime();
                      const isPast = end.getTime() < now.getTime();

                      return (
                        <div
                          key={entry.id || eIdx}
                          onClick={() => {
                            addToHistory({ id: stream.stream_id, type: 'live', name: stream.name, icon: stream.stream_icon });
                            window.open(`/player/live/${stream.stream_id}`, '_blank');
                          }}
                          className={`absolute top-1 bottom-1 rounded-md px-2 py-1 overflow-hidden cursor-pointer group/ep transition-colors border ${
                            isNow
                              ? 'bg-primary/20 border-primary/50 shadow-sm hover:bg-primary/30'
                              : isPast
                                ? 'bg-muted/40 border-border/30 hover:bg-muted/60'
                                : 'bg-secondary/60 border-border/40 hover:bg-secondary/90'
                          }`}
                          style={{ left: leftPx, width: widthPx }}
                          title={`▶ Assistir ${stream.name}\n${entry.title}\n${formatTime(start)} - ${formatTime(end)}${entry.description ? '\n' + entry.description : ''}`}
                        >
                          <p className={`text-[10px] font-semibold truncate leading-tight ${
                            isNow ? 'text-primary' : isPast ? 'text-muted-foreground/60' : 'text-foreground'
                          }`}>
                            {entry.title}
                          </p>
                          <p className={`text-[9px] truncate ${
                            isNow ? 'text-primary/70' : 'text-muted-foreground/70'
                          }`}>
                            {formatTime(start)} - {formatTime(end)}
                          </p>
                        </div>
                      );
                    }) : (
                      <div className="absolute inset-0 flex items-center px-4">
                        <span className="text-[10px] text-muted-foreground/50 italic">
                          {loadingEpg ? 'Carregando...' : 'Sem dados de programação'}
                        </span>
                      </div>
                    )}

                    {/* Now indicator line */}
                    {isToday && (() => {
                      const nowPx = ((now.getTime() - dayStart) / (1000 * 60 * 60)) * HOUR_WIDTH;
                      return (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-destructive z-[4] pointer-events-none"
                          style={{ left: nowPx }}
                        >
                          <div className="absolute -top-0.5 -left-1 w-2.5 h-2.5 rounded-full bg-destructive" />
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              );
            })}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">Nenhum canal encontrado.</div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        Mostrando até 50 canais. Use a busca ou categorias para filtrar.
      </p>
    </div>
  );
}
