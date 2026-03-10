import { useAuth } from '@/contexts/AuthContext';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Trash2, Server, Clock } from 'lucide-react';

export default function SettingsPage() {
  const { userInfo, playlistName, logout } = useAuth();
  const { history, clearHistory } = useWatchHistory();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">Configurações</h1>

      <div className="bg-card rounded-xl p-5 border border-border mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-primary" /> Informações
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Playlist</span>
            <span className="text-foreground">{playlistName || '-'}</span>
          </div>
          {userInfo?.status && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={userInfo.status === 'Active' ? 'text-accent' : 'text-destructive'}>{userInfo.status}</span>
            </div>
          )}
          {userInfo?.exp_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expiração</span>
              <span className="text-foreground">{new Date(Number(userInfo.exp_date) * 1000).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>
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

      <Button onClick={logout} variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive/10 mt-4">
        Desconectar
      </Button>

      <p className="text-center text-muted-foreground text-xs mt-8">AMTECH PLAYER v1.0</p>
    </motion.div>
  );
}
