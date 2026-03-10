import { useAuth } from '@/contexts/AuthContext';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Trash2, User, Server, Clock } from 'lucide-react';

export default function SettingsPage() {
  const { authData, credentials, logout } = useAuth();
  const { history, clearHistory } = useWatchHistory();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">Configurações</h1>

      {/* Account Info */}
      <div className="bg-card rounded-xl p-5 border border-border mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" /> Conta
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Usuário</span>
            <span className="text-foreground">{authData?.user_info?.username || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className={authData?.user_info?.status === 'Active' ? 'text-accent' : 'text-destructive'}>
              {authData?.user_info?.status || '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Conexões ativas</span>
            <span className="text-foreground">{authData?.user_info?.active_cons || '0'} / {authData?.user_info?.max_connections || '-'}</span>
          </div>
          {authData?.user_info?.exp_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expiração</span>
              <span className="text-foreground">
                {new Date(Number(authData.user_info.exp_date) * 1000).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Server Info */}
      <div className="bg-card rounded-xl p-5 border border-border mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-primary" /> Servidor
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">URL</span>
            <span className="text-foreground truncate ml-4">{credentials?.server || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Playlist</span>
            <span className="text-foreground">{credentials?.playlistName || '-'}</span>
          </div>
        </div>
      </div>

      {/* History */}
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
