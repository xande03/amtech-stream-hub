import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Loader2, Save, Tv, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AdminPage() {
  const navigate = useNavigate();
  const { setConfig, isConfigured } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
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
      const { data } = await supabase.functions.invoke('admin-config', {
        body: { action: 'get_config' },
      });
      if (data?.config) {
        setHasExisting(true);
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
    if (!form.password && !hasExisting) {
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
      });
      if (error) throw new Error('Erro ao salvar');
      if (data?.error) throw new Error(data.error);

      setHasExisting(true);
      // Save access code locally and navigate to home
      setConfig(form.access_code.trim());
      toast.success('Playlist configurada com sucesso!');
      navigate('/');
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
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Tv className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AMTECH PLAYER</h1>
            <p className="text-sm text-muted-foreground">Configure sua playlist IPTV</p>
          </div>
        </div>

        {isConfigured && (
          <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-lg p-3 mb-6 text-sm text-accent">
            <CheckCircle className="w-4 h-4" />
            <span>Playlist ativa — <button onClick={() => navigate('/')} className="underline font-medium">ir para o conteúdo</button></span>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-1">Credenciais Xtream Codes</h2>
          <p className="text-sm text-muted-foreground mb-5">Insira os dados do servidor para carregar os conteúdos</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">URL do Servidor *</Label>
              <Input placeholder="http://servidor.com:8080" value={form.server_url} onChange={e => setForm(f => ({ ...f, server_url: e.target.value }))} className="bg-secondary border-border text-foreground" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Usuário *</Label>
                <Input placeholder="Usuário" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="bg-secondary border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Senha *</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder={hasExisting ? 'Manter atual' : 'Senha'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="bg-secondary border-border text-foreground pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nome da Playlist</Label>
                <Input placeholder="Principal" value={form.playlist_name} onChange={e => setForm(f => ({ ...f, playlist_name: e.target.value }))} className="bg-secondary border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Código de Acesso *</Label>
                <div className="relative">
                  <Input type={showAccessCode ? 'text' : 'password'} placeholder="Ex: 123" value={form.access_code} onChange={e => setForm(f => ({ ...f, access_code: e.target.value }))} className="bg-secondary border-border text-foreground pr-10" />
                  <button type="button" onClick={() => setShowAccessCode(!showAccessCode)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showAccessCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground font-medium h-12 text-base mt-2">
              {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              Salvar e Acessar
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
