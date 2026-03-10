import { useAuth } from '@/contexts/AuthContext';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Trash2, Server, Clock, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { playlistName, clearConfig } = useAuth();
  const { history, clearHistory } = useWatchHistory();
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">Configurações</h1>

      <div className="bg-card rounded-xl p-5 border border-border mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-primary" /> Playlist
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nome</span>
            <span className="text-foreground">{playlistName || 'Principal'}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="mt-3 border-border text-foreground hover:bg-secondary">
          <SettingsIcon className="w-4 h-4 mr-1" /> Gerenciar Playlist
        </Button>
      </div>

      <div className="bg-card rounded-xl p-5 border border-border mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" /> Histórico
        </h2>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{history.length} itens no histórico</span>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory} className="border-border text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4 mr-1" /> Limpar
            </Button>
          )}
        </div>
      </div>

      <Button onClick={clearConfig} variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive/10 mt-4">
        Desconectar Playlist
      </Button>

      <p className="text-center text-muted-foreground text-xs mt-8">AMTECH PLAYER v1.0</p>
    </motion.div>
  );
}
