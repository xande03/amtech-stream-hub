import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '@/components/VideoPlayer';
import { getStreamUrl, getProxyStreamUrl } from '@/services/xtreamApi';
import { Loader2 } from 'lucide-react';

export default function SharedPlayer() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [searchParams] = useSearchParams();
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // O link compartilhado pode conter o accessCode como parâmetro para funcionar para qualquer pessoa
  // Se não houver, tenta pegar do localStorage ou context (através do useAuth se estivéssemos usando)
  const accessCode = searchParams.get('ac') || localStorage.getItem('xerife_access_code');
  const title = searchParams.get('title') || 'Reproduzindo...';

  useEffect(() => {
    if (!accessCode) {
      setError('Código de acesso não encontrado. Você precisa estar configurado para assistir.');
      setLoading(false);
      return;
    }

    if (!type || !id) {
      setError('Informações da mídia inválidas.');
      setLoading(false);
      return;
    }

    const loadStream = async () => {
      try {
        setLoading(true);
        const streamType = type as 'movie' | 'series';
        const url = await getStreamUrl(accessCode, streamType, id, 'mp4');
        setStreamUrl(url);
      } catch (err: any) {
        // Tenta com proxy se falhar direto (CORS)
        try {
          const proxyUrl = getProxyStreamUrl(accessCode, type as any, id, 'mp4');
          setStreamUrl(proxyUrl);
        } catch (innerErr) {
          setError('Erro ao carregar o vídeo. O link pode ter expirado ou o servidor está offline.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadStream();
  }, [accessCode, type, id]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-zinc-400 animate-pulse">Carregando player...</p>
      </div>
    );
  }

  if (error || !streamUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center text-center p-6 text-white">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <div className="w-8 h-8 rounded-full border-2 border-destructive flex items-center justify-center font-bold">!</div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Ops! Algo deu errado</h2>
        <p className="text-zinc-400 mb-8 max-w-md">{error}</p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-bold transition-transform hover:scale-105"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <VideoPlayer
        url={streamUrl}
        title={title}
        autoPlay
        onClose={() => navigate(-1)}
      />
    </div>
  );
}
