import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Server, Clock, Plus, Eye, EyeOff, Lock, Power, PowerOff,
  Loader2, Save, Shield, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

interface PlaylistConfig {
  id: string;
  server_url: string;
  username: string;
  playlist_name: string;
  access_code: string;
  is_active: boolean;
  created_at: string;
}

export default function SettingsPage() {
  const { playlistName, refreshConfig } = useAuth();
  const { history, clearHistory } = useWatchHistory();

  // Admin auth
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Playlist management
  const [playlists, setPlaylists] = useState<PlaylistConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    server_url: '', username: '', password: '', playlist_name: '', access_code: '',
  });

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('admin-config', {
        body: { action: 'get_config' },
      });
      setPlaylists(data?.configs || []);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isUnlocked) loadPlaylists();
  }, [isUnlocked, loadPlaylists]);

  const handleUnlock = () => {
    // We validate server-side; store password for subsequent calls
    if (!adminPassword.trim()) {
      setAuthError('Digite a senha');
      return;
    }
    setAuthError('');
    setIsUnlocked(true);
  };

  const handleAddPlaylist = async () => {
    if (!form.server_url || !form.username || !form.password || !form.access_code) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-config', {
        body: {
          action: 'save_config',
          admin_password: adminPassword,
          config: {
            server_url: form.server_url.trim(),
            username: form.username.trim(),
            password: form.password.trim(),
            playlist_name: form.playlist_name.trim() || 'Nova Playlist',
            access_code: form.access_code.trim(),
          },
        },
      });
      if (data?.error) {
        if (data.error.includes('Senha')) { setIsUnlocked(false); setAuthError('Senha inválida'); }
        throw new Error(data.error);
      }
      toast.success('Playlist adicionada!');
      setForm({ server_url: '', username: '', password: '', playlist_name: '', access_code: '' });
      setShowAddForm(false);
      loadPlaylists();
      refreshConfig();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    }
    setSaving(false);
  };

  const handleToggle = async (id: string) => {
    try {
      const { data } = await supabase.functions.invoke('admin-config', {
        body: { action: 'toggle_config', id, admin_password: adminPassword },
      });
      if (data?.error) {
        if (data.error.includes('Senha')) { setIsUnlocked(false); setAuthError('Senha inválida'); }
        throw new Error(data.error);
      }
      toast.success('Status atualizado');
      loadPlaylists();
      refreshConfig();
    } catch (err: any) {
      toast.error(err.message || 'Erro');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta playlist?')) return;
    try {
      const { data } = await supabase.functions.invoke('admin-config', {
        body: { action: 'delete_config', id, admin_password: adminPassword },
      });
      if (data?.error) {
        if (data.error.includes('Senha')) { setIsUnlocked(false); setAuthError('Senha inválida'); }
        throw new Error(data.error);
      }
      toast.success('Playlist excluída');
      loadPlaylists();
      refreshConfig();
    } catch (err: any) {
      toast.error(err.message || 'Erro');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Configurações</h1>

      {/* History section - always visible */}
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

      {/* Admin section */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-5">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-primary" /> Gerenciar Playlists
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Área restrita ao administrador</p>

          {!isUnlocked ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Senha de Administrador</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Digite a senha..."
                    value={adminPassword}
                    onChange={e => { setAdminPassword(e.target.value); setAuthError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                    className="bg-secondary border-border text-foreground"
                  />
                  <Button onClick={handleUnlock} className="gradient-primary text-primary-foreground px-6">
                    <Lock className="w-4 h-4 mr-1" /> Entrar
                  </Button>
                </div>
                {authError && <p className="text-destructive text-xs">{authError}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                <>
                  {/* Playlist list */}
                  {playlists.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma playlist cadastrada</p>
                  ) : (
                    <div className="space-y-2">
                      {playlists.map(pl => (
                        <div key={pl.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${pl.is_active ? 'border-primary/50 bg-primary/5' : 'border-border bg-secondary/30'}`}>
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pl.is_active ? 'bg-accent animate-pulse' : 'bg-muted-foreground/30'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{pl.playlist_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{pl.server_url}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pl.is_active ? 'bg-accent/20 text-accent' : 'bg-secondary text-muted-foreground'}`}>
                            {pl.is_active ? 'ATIVA' : 'INATIVA'}
                          </span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handleToggle(pl.id)} title={pl.is_active ? 'Desativar' : 'Ativar'}>
                              {pl.is_active ? <PowerOff className="w-4 h-4 text-muted-foreground" /> : <Power className="w-4 h-4 text-accent" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handleDelete(pl.id)} title="Excluir">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add form toggle */}
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="w-full border-dashed border-border text-foreground hover:border-primary/50"
                  >
                    {showAddForm ? <ChevronUp className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {showAddForm ? 'Cancelar' : 'Adicionar Playlist'}
                  </Button>

                  <AnimatePresence>
                    {showAddForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm">Nome da Playlist</Label>
                          <Input placeholder="Minha Playlist" value={form.playlist_name} onChange={e => setForm(f => ({ ...f, playlist_name: e.target.value }))} className="bg-secondary border-border text-foreground" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm">URL do Servidor *</Label>
                          <Input placeholder="http://servidor.com:8080" value={form.server_url} onChange={e => setForm(f => ({ ...f, server_url: e.target.value }))} className="bg-secondary border-border text-foreground" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-foreground text-sm">Usuário *</Label>
                            <Input placeholder="Usuário" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="bg-secondary border-border text-foreground" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-foreground text-sm">Senha *</Label>
                            <div className="relative">
                              <Input type={showPassword ? 'text' : 'password'} placeholder="Senha" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="bg-secondary border-border text-foreground pr-9" />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm">Código de Acesso *</Label>
                          <Input placeholder="Ex: 123" value={form.access_code} onChange={e => setForm(f => ({ ...f, access_code: e.target.value }))} className="bg-secondary border-border text-foreground" />
                        </div>
                        <Button onClick={handleAddPlaylist} disabled={saving} className="w-full gradient-primary text-primary-foreground font-medium">
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Salvar Playlist
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-muted-foreground text-xs mt-8">AMTECH PLAYER v1.0</p>
    </motion.div>
  );
}
