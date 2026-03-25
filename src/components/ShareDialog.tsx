import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'movie' | 'series';
  id: string | number;
}

export function ShareDialog({ isOpen, onClose, title, type, id }: ShareDialogProps) {
  const [copied, setCopied] = React.useState(false);
  const { accessCode } = useAuth();

  // Criar um link "diretório" referenciando o nome do app e o filme sem deixar vestígios do app completo
  const shareUrl = useMemo(() => {
    const baseUrl = `${window.location.origin}/view/${type}/${id}/${encodeURIComponent(title.replace(/\s+/g, '-').toLowerCase())}`;
    const params = new URLSearchParams({
      title,
      ac: accessCode || ''
    });
    return `${baseUrl}?${params.toString()}`;
  }, [type, id, title, accessCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Assistir ${title} no Xerife Hub`,
          text: `Confira ${title} no nosso app!`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" /> Compartilhar {type === 'movie' ? 'Filme' : 'Série'}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Escaneie o QR Code ou copie o link para compartilhar <strong>{title}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl my-4">
          <QRCodeSVG value={shareUrl} size={200} level="H" includeMargin={true} />
        </div>

        <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 p-2 rounded-lg">
          <div className="grid flex-1 gap-2">
            <input
              className="bg-transparent border-none focus:ring-0 text-sm py-1 px-2 text-zinc-300 pointer-events-none truncate"
              value={shareUrl}
              readOnly
            />
          </div>
          <Button type="button" size="sm" onClick={handleCopy} className="h-9 px-3 bg-zinc-800 hover:bg-zinc-700 text-white">
            <span className="sr-only">Copiar</span>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <DialogFooter className="sm:justify-start gap-2">
          <Button onClick={handleNativeShare} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full py-6">
            <Share2 className="w-4 h-4 mr-2" /> Compartilhar Agora
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full border-zinc-800 text-zinc-400 hover:text-white rounded-full py-6">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
