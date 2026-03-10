import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Loader2, Save, Tv, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AdminConfig {
  id: string;
  server_url: string;
  username: string;
  playlist_name: string;
  access_code: string;
  is_active: boolean;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [form, setForm] = useState({
    server_url: '',
    username: '',
    password: '',
    playlist_name: 'Principal',
    access_code: '',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-config', {
        body: { action: 'get_config' },
        headers: { 'x-admin-secret': 'skip' },
      });
      if (data?.config) {
        setConfig(data.config);
        setForm({
          server_url: data.config.server_url || '',
          username: data.config.username || '',
          password: '',
          playlist_name: data.config.playlist_name || 'Principal',
          access_code: data.config.access_code || '',
        });
      }
    } catch {}
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.server_url || !form.username || !form.access_code) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (!form.password && !config) {
      toast.error('Insira a senha do servidor');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-config', {
        body: {
          action: 'save_config',
          config: {
            server_url: form.server_url.trim(),
            username: form.username.trim(),
            password: form.password.trim(),
            playlist_name: form.playlist_name.trim() || 'Principal',
            access_code: form.access_code.trim(),
          },
        },
        headers: { 'x-admin-secret': 'skip' },
      });
      if (error) throw new Error('Erro ao salvar');
      if (data?.error) throw new Error(data.error);

      setConfig(data.config);
      toast.success('Configuração salva com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Tv className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Painel Admin</h1>
              <p className="text-xs text-muted-foreground">Configuração da Playlist IPTV</p>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar
          </button>
        </div>

        {config && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-6 text-sm text-accent">
            ✅ Playlist ativa: <strong>{config.playlist_name}</strong>
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Credenciais Xtream Codes</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">URL do Servidor *</Label>
              <Input placeholder="http://servidor.com:8080" value={form.server_url} onChange={e => setForm(f => ({ ...f, server_url: e.target.value }))} className="bg-secondary border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Usuário *</Label>
              <Input placeholder="Usuário Xtream" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="bg-secondary border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Senha *</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} placeholder={config ? 'Deixe em branco para manter' : 'Senha Xtream'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="bg-secondary border-border text-foreground pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Nome da Playlist</Label>
              <Input placeholder="Principal" value={form.playlist_name} onChange={e => setForm(f => ({ ...f, playlist_name: e.target.value }))} className="bg-secondary border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Código de Acesso (para usuários) *</Label>
              <div className="relative">
                <Input type={showAccessCode ? 'text' : 'password'} placeholder="Código que os usuários usarão" value={form.access_code} onChange={e => setForm(f => ({ ...f, access_code: e.target.value }))} className="bg-secondary border-border text-foreground pr-10" />
                <button type="button" onClick={() => setShowAccessCode(!showAccessCode)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showAccessCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground font-medium h-11">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Configuração
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
