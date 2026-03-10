import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { XtreamCredentials } from '@/services/xtreamApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Loader2, Tv, Wifi } from 'lucide-react';

export default function Login() {
  const { login, isLoading, error } = useAuth();
  const [form, setForm] = useState({
    server: '',
    username: '',
    password: '',
    playlistName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const creds: XtreamCredentials = {
      server: form.server.trim(),
      username: form.username.trim(),
      password: form.password.trim(),
      playlistName: form.playlistName.trim() || 'Minha Lista',
    };
    try {
      await login(creds);
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary shadow-glow mb-4"
          >
            <Tv className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">AMTECH PLAYER</h1>
          <p className="text-muted-foreground mt-2">Conecte-se ao seu servidor IPTV</p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-glow">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="server" className="text-foreground">URL do Servidor</Label>
              <div className="relative">
                <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="server"
                  placeholder="http://servidor.com:8080"
                  value={form.server}
                  onChange={e => setForm(f => ({ ...f, server: e.target.value }))}
                  className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">Usuário</Label>
              <Input
                id="username"
                placeholder="Seu usuário"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="playlist" className="text-foreground">Nome da Playlist</Label>
              <Input
                id="playlist"
                placeholder="Minha Lista"
                value={form.playlistName}
                onChange={e => setForm(f => ({ ...f, playlistName: e.target.value }))}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-destructive text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gradient-primary text-primary-foreground font-semibold h-12 text-base hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Conectar'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-6">
          AMTECH PLAYER v1.0 — Streaming IPTV
        </p>
      </motion.div>
    </div>
  );
}
