import { useState } from 'react';
import { useDownloads, DownloadItem } from '@/hooks/useDownloads';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Film, Clapperboard, Trash2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { posterImage } from '@/lib/imageProxy';

export default function Downloads() {
  const { downloads, movieDownloads, seriesDownloads, removeDownload, clearAll } = useDownloads();
  const [tab, setTab] = useState<'all' | 'movie' | 'series'>('all');
  const navigate = useNavigate();

  const filtered = tab === 'movie' ? movieDownloads : tab === 'series' ? seriesDownloads : downloads;

  const statusIcon = (status: DownloadItem['status']) => {
    if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'downloading') return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    return <AlertCircle className="w-4 h-4 text-destructive" />;
  };

  // Group series downloads by seriesId/name
  const groupedSeries = seriesDownloads.reduce<Record<string, DownloadItem[]>>((acc, d) => {
    const key = d.seriesId ? String(d.seriesId) : d.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Download className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Downloads</h1>
          <span className="text-sm text-muted-foreground">({downloads.length})</span>
        </div>
        {downloads.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4 mr-1" /> Limpar tudo
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all' as const, label: 'Todos', count: downloads.length },
          { key: 'movie' as const, label: 'Filmes', icon: Film, count: movieDownloads.length },
          { key: 'series' as const, label: 'Séries', icon: Clapperboard, count: seriesDownloads.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon && <t.icon className="w-4 h-4" />}
            {t.label}
            <span className="text-xs opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Download className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum download encontrado</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Baixe filmes e séries para acessar aqui</p>
        </div>
      ) : tab === 'series' ? (
        // Grouped view for series
        <div className="space-y-6">
          {Object.entries(groupedSeries).map(([key, episodes]) => (
            <div key={key} className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-border/50">
                <div className="w-10 h-14 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                  {episodes[0]?.icon && <img src={posterImage(episodes[0].icon)} alt="" className="w-full h-full object-cover" />}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{episodes[0]?.name}</h3>
                  <p className="text-xs text-muted-foreground">{episodes.length} episódio{episodes.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="divide-y divide-border/30">
                {episodes.sort((a, b) => (a.episodeInfo || '').localeCompare(b.episodeInfo || '')).map(d => (
                  <DownloadRow key={`${d.id}-${d.episodeInfo}`} item={d} onRemove={removeDownload} statusIcon={statusIcon} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Flat list for movies and all
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map(d => (
              <motion.div key={`${d.id}-${d.type}-${d.episodeInfo}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}>
                <DownloadRow item={d} onRemove={removeDownload} statusIcon={statusIcon} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function DownloadRow({ item, onRemove, statusIcon }: {
  item: DownloadItem;
  onRemove: (id: string | number, type: string, episodeInfo?: string) => void;
  statusIcon: (status: DownloadItem['status']) => React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/20 transition-colors">
      <div className="w-12 h-16 rounded-md overflow-hidden bg-secondary flex-shrink-0">
        {item.icon && <img src={posterImage(item.icon)} alt={item.name} className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
        {item.episodeInfo && <p className="text-xs text-muted-foreground">{item.episodeInfo}{item.episodeTitle ? ` — ${item.episodeTitle}` : ''}</p>}
        <div className="flex items-center gap-2 mt-1">
          {statusIcon(item.status)}
          {item.status === 'downloading' ? (
            <div className="flex-1 max-w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.progress}%` }} />
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              {item.status === 'completed' ? 'Baixado' : 'Erro'}
            </span>
          )}
        </div>
      </div>
      <button onClick={() => onRemove(item.id, item.type, item.episodeInfo)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
