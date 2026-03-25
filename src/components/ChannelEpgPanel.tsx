import { useState, useEffect } from 'react';
import { getShortEpg, EpgEntry } from '@/services/xtreamApi';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

function decodeBase64(str: string): string {
  try {
    // Check if it looks like base64 (only valid base64 chars and reasonable length)
    if (/^[A-Za-z0-9+/=]+$/.test(str) && str.length > 8) {
      return decodeURIComponent(escape(atob(str)));
    }
  } catch {}
  return str;
}

function parseTimestamp(ts: string | number): Date | null {
  if (!ts) return null;
  if (typeof ts === 'number' && ts > 0) return new Date(ts * 1000);
  if (typeof ts === 'string') {
    // Try parsing directly
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d;
    // Try YYYY-MM-DD HH:MM:SS format
    const match = ts.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):?(\d{2})?/);
    if (match) return new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6] || '00'}`);
  }
  return null;
}

function formatTime(ts: string | number): string {
  const date = parseTimestamp(ts);
  if (!date) return '--:--';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function isNow(entry: EpgEntry): boolean {
  const now = Date.now();
  const start = parseTimestamp(entry.start_timestamp || entry.start);
  const end = parseTimestamp(entry.stop_timestamp || entry.end);
  if (!start || !end) return false;
  return now >= start.getTime() && now < end.getTime();
}

interface Props {
  streamId: number;
  compact?: boolean;
}

export default function ChannelEpgPanel({ streamId, compact = false }: Props) {
  const { serverInfo } = useAuth();
  const [entries, setEntries] = useState<EpgEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadEpg = () => {
    if (loaded || !serverInfo) return;
    setLoading(true);
    getShortEpg(serverInfo, streamId, 8)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => { setLoading(false); setLoaded(true); });
  };

  // Load on expand
  useEffect(() => {
    if (expanded) loadEpg();
  }, [expanded]);

  const currentProgram = entries.find(isNow);
  const upcomingPrograms = entries.filter(e => !isNow(e));

  if (compact) {
    // Just show "now playing" text inline
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <Clock className="w-3 h-3 flex-shrink-0" />
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : currentProgram ? (
          <span className="truncate text-left">
            <span className="text-primary font-medium">Agora:</span> {decodeBase64(currentProgram.title)}
          </span>
        ) : loaded ? (
          <span className="italic">Sem programação</span>
        ) : (
          <span>Ver programação</span>
        )}
        {loaded && entries.length > 0 && (
          expanded ? <ChevronUp className="w-3 h-3 flex-shrink-0 ml-auto" /> : <ChevronDown className="w-3 h-3 flex-shrink-0 ml-auto" />
        )}
      </button>
    );
  }

  return (
    <div onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1.5 w-full text-left px-1 py-1 rounded-md hover:bg-secondary/60 transition-colors"
      >
        <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        ) : currentProgram ? (
          <span className="text-xs truncate">
            <span className="text-primary font-semibold">Agora:</span>{' '}
            <span className="text-foreground">{decodeBase64(currentProgram.title)}</span>
          </span>
        ) : loaded ? (
          <span className="text-xs text-muted-foreground italic">Sem programação</span>
        ) : (
          <span className="text-xs text-muted-foreground">Ver programação</span>
        )}
        {loaded && entries.length > 0 && (
          expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
        )}
      </button>

      {expanded && loaded && entries.length > 0 && (
        <div className="mt-1 space-y-0.5 max-h-40 overflow-y-auto">
          {entries.map((entry, i) => {
            const now = isNow(entry);
            return (
              <div
                key={entry.id || i}
                className={`flex items-start gap-2 px-2 py-1.5 rounded-md text-xs ${
                  now ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary/40'
                }`}
              >
                <span className={`font-mono flex-shrink-0 ${now ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                  {formatTime(entry.start_timestamp || entry.start)}
                </span>
                <span className={`truncate ${now ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {decodeBase64(entry.title)}
                </span>
                {now && (
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-destructive animate-pulse mt-1" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
