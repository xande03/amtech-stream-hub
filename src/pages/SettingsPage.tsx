import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Clock, Plus, Eye, EyeOff, Lock, Power, PowerOff,
  Loader2, Save, Shield, Pencil, X, CheckCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Configuracoes from '@/components/Configuracoes';

interface PlaylistConfig {
  id: string;
  server_url: string;
  username: string;
  playlist_name: string;
  access_code: string;
  is_active: boolean;
  created_at: string;
}

interface PlaylistForm {
  server_url: string;
  username: string;
  password: string;
  playlist_name: string;
  access_code: string;
}

const emptyForm: PlaylistForm = { server_url: '', username: '', password: '', playlist_name: '', access_code: '' };

export default function SettingsPage() {
  const { refreshConfig } = useAuth();
  const { history, clearHistory } = useWatchHistory();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [playlists, setPlaylists] = useState<PlaylistConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [form, setForm] = useState<PlaylistForm>(emptyForm);
  const [hasPasswordSet, setHasPasswordSet] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('xerife_admin_pass');
    setHasPasswordSet(!!saved);
  }, []);

  const handleSetPassword = () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem ou estão vazias');
      return;
    }
    localStorage.setItem('xerife_admin_pass', newPassword);
    setHasPasswordSet(true);
    toast.success('Senha definida com sucesso!');
  };

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_config')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPlaylists(data || []);
    } catch (err: any) {
      console.error('Error loading playlists:', err);
      toast.error('Erro ao carregar as playlists do banco direto');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isUnlocked) loadPlaylists();
  }, [isUnlocked, loadPlaylists]);

  const handleUnlock = () => {
    const saved = localStorage.getItem('xerife_admin_pass');
    if (!adminPassword.trim()) { setAuthError('Digite a senha'); return; }
    if (adminPassword !== saved) { setAuthError('Senha incorreta'); return; }
    setAuthError('');
    setIsUnlocked(true);
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setShowPassword(false);
    setTestResult(null);
  };

  const openEditForm = (pl: PlaylistConfig) => {
    setEditingId(pl.id);
    setForm({
      server_url: pl.server_url,
      username: pl.username,
      password: '',
      playlist_name: pl.playlist_name,
      access_code: pl.access_code,
    });
    setShowForm(true);
    setShowPassword(false);
    setTestResult(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!form.server_url || !form.username || !form.password) {
      toast.error('Preencha servidor, usuário e senha para testar');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('xtream-proxy', {
        body: {
          action: 'test_connection',
          server_url: form.server_url.trim(),
          username: form.username.trim(),
          password: form.password.trim(),
        },
      });
      if (error || data?.error) {
        setTestResult({ ok: false, msg: data?.error || error?.message || 'Falha na conexão' });
      } else {
        if (data?.resolved_url && data.resolved_url !== form.server_url.trim()) {
          setForm(f => ({ ...f, server_url: data.resolved_url }));
        }
        setTestResult({ ok: true, msg: `Conectado! ${data?.user_info?.status === 'Active' ? 'Conta ativa' : 'Servidor respondeu'}` });
      }
    } catch (err: any) {
      setTestResult({ ok: false, msg: err.message || 'Erro ao testar' });
    }
    setTesting(false);
  };

  const handleSave = async () => {
    if (!form.server_url || !form.username || !form.access_code) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    if (!editingId && !form.password) {
      toast.error('Senha é obrigatória para nova playlist');
      return;
    }

    setSaving(true);
    try {
      const configData: any = {
        server_url: form.server_url.trim(),
        username: form.username.trim(),
        playlist_name: form.playlist_name.trim() || 'Nova Playlist',
        access_code: form.access_code.trim(),
      };
      
      if (form.password) configData.password = form.password.trim();

      let error;
      if (editingId) {
        const { error: updateError } = await supabase
          .from('admin_config')
          .update(configData)
          .eq('id', editingId);
        error = updateError;
      } else {
        // Enforce password for new playlists (should be checked by UI already)
        if (!configData.password) throw new Error('Senha é obrigatória para novas playlists');
        
        configData.is_active = false; // New playlists start inactive
        const { error: insertError } = await supabase
          .from('admin_config')
          .insert([configData]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(editingId ? 'Playlist atualizada!' : 'Playlist adicionada!');
      closeForm();
      loadPlaylists();
      refreshConfig();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Erro ao salvar no banco direto');
    }
    setSaving(false);
  };

  const handleToggle = async (id: string) => {
    try {
      const target = playlists.find(p => p.id === id);
      if (!target) return;
      
      const newStatus = !target.is_active;

      // If activating, we might want to deactivate others (optional, but usually preferred for "Active Playlist")
      // In this app, only one can be active at a time? AuthContext uses maybeSingle().
      if (newStatus) {
        await supabase.from('admin_config').update({ is_active: false }).neq('id', id);
      }

      const { error } = await supabase
        .from('admin_config')
        .update({ is_active: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(newStatus ? 'Playlist ativada!' : 'Playlist desativada!');
      loadPlaylists();
      refreshConfig();
    } catch (err: any) {
      console.error('Toggle error:', err);
      toast.error(err.message || 'Erro ao alternar playlist');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta playlist?')) return;
    try {
      const { error } = await supabase
        .from('admin_config')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Playlist excluída');
      loadPlaylists();
      refreshConfig();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Erro ao excluir playlist');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Configurações</h1>

      {/* History section */}
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

      {/* Paleta de Cores */}
      <div className="mb-4">
        <Configuracoes />
      </div>

      {/* Acesso Restrito - compacto, próximo ao rodapé */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mt-8">
        {!isUnlocked ? (
          <button
            type="button"
            onClick={() => {
              if (!hasPasswordSet) {
                setIsUnlocked(false);
              }
            }}
            className="w-full p-4 flex items-center justify-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Acesso Restrito</span>
          </button>
        ) : null}

        <AnimatePresence>
          {!isUnlocked && (
            <motion.div
              initial={false}
              className="px-5 pb-5"
            >
              {!hasPasswordSet ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/20">
                    Defina uma senha para proteger suas playlists.
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Nova Senha</Label>
                      <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirmar Senha</Label>
                      <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-secondary" />
                    </div>
                    <Button onClick={handleSetPassword} className="w-full gradient-primary">Definir Senha</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 max-w-xs mx-auto">
                    <Input
                      type="password"
                      placeholder="Digite sua senha..."
                      value={adminPassword}
                      onChange={e => { setAdminPassword(e.target.value); setAuthError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                      className="bg-secondary border-border text-foreground text-center text-sm"
                    />
                    <Button onClick={handleUnlock} size="sm" className="gradient-primary text-primary-foreground w-full">
                      Desbloquear
                    </Button>
                  </div>
                  {authError && <p className="text-destructive text-xs text-center">{authError}</p>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isUnlocked && (
          <div className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-primary" /> Gerenciar Playlists
            </h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              <>
                {playlists.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma playlist cadastrada</p>
                ) : (
                  <div className="space-y-2">
                    {playlists.map(pl => (
                      <div key={pl.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${pl.is_active ? 'border-primary/50 bg-primary/5' : 'border-border bg-secondary/30'}`}>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pl.is_active ? 'bg-accent animate-pulse' : 'bg-muted-foreground/30'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{pl.playlist_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{pl.server_url} • {pl.username}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pl.is_active ? 'bg-accent/20 text-accent' : 'bg-secondary text-muted-foreground'}`}>
                          {pl.is_active ? 'ATIVA' : 'INATIVA'}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEditForm(pl)} title="Editar">
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </Button>
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

                {!showForm && (
                  <Button variant="outline" onClick={openAddForm} className="w-full border-dashed border-border text-foreground hover:border-primary/50">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Playlist
                  </Button>
                )}

                <AnimatePresence>
                  {showForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">
                          {editingId ? 'Editar Playlist' : 'Nova Playlist'}
                        </p>
                        <button onClick={closeForm} className="p-1 rounded-full hover:bg-muted transition-colors">
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Nome da Playlist</Label>
                        <Input placeholder="Minha Playlist" value={form.playlist_name} onChange={e => setForm(f => ({ ...f, playlist_name: e.target.value }))} className="bg-secondary border-border text-foreground" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Servidor (URL ou nome do provedor) *</Label>
                        <Input 
                          placeholder="http://servidor.com:8080 ou nome (ex: warez)" 
                          value={form.server_url} 
                          onChange={e => { setForm(f => ({ ...f, server_url: e.target.value })); setTestResult(null); }} 
                          className="bg-secondary border-border text-foreground" 
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Use a URL completa (ex: http://servidor.com:8080) ou apenas o nome do provedor (ex: warez). O sistema tentará resolver automaticamente.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm">Usuário *</Label>
                          <Input 
                            placeholder="Username" 
                            value={form.username} 
                            onChange={e => { setForm(f => ({ ...f, username: e.target.value })); setTestResult(null); }} 
                            className="bg-secondary border-border text-foreground" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm">
                            Senha {editingId ? '(vazio = manter)' : '*'}
                          </Label>
                          <div className="relative">
                            <Input 
                              type={showPassword ? 'text' : 'password'} 
                              placeholder={editingId ? '••••••' : 'Password'} 
                              value={form.password} 
                              onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setTestResult(null); }} 
                              className="bg-secondary border-border text-foreground pr-9" 
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        onClick={handleTestConnection} 
                        disabled={testing || !form.server_url || !form.username || !form.password}
                        className="w-full border-border text-foreground"
                      >
                        {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Testar Conexão
                      </Button>

                      {testResult && (
                        <div className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${testResult.ok ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'}`}>
                          {testResult.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                          <span>{testResult.msg}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-foreground text-sm">Código de Acesso *</Label>
                        <Input placeholder="Ex: 123" value={form.access_code} onChange={e => setForm(f => ({ ...f, access_code: e.target.value }))} className="bg-secondary border-border text-foreground" />
                        <p className="text-[11px] text-muted-foreground">Código que os usuários usarão para acessar esta playlist</p>
                      </div>

                      <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground font-medium">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {editingId ? 'Atualizar Playlist' : 'Salvar Playlist'}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-muted-foreground text-xs mt-8">AMTECH PLAYER v1.0</p>
    </motion.div>
  );
}
