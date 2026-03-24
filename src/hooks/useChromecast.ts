import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useChromecast() {
  const [isCasting, setIsCasting] = useState(false);

  const initCastAndGetSession = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      // If already initialized
      if (window.cast?.framework) {
        const context = window.cast.framework.CastContext.getInstance();
        try {
          context.setOptions({
            receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
            autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
          });
        } catch (e) { /* ignore if already set */ }
        
        context.requestSession()
          .then(() => resolve(context.getCurrentSession()))
          .catch(reject);
        return;
      }

      // Add scripts
      window.__onGCastApiAvailable = (isAvailable: boolean) => {
        if (isAvailable && window.cast?.framework) {
          const context = window.cast.framework.CastContext.getInstance();
          context.setOptions({
            receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
            autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
          });
          context.requestSession()
            .then(() => resolve(context.getCurrentSession()))
            .catch(reject);
        } else {
          reject('Cast API not available');
        }
      };

      if (!document.getElementById('cast-api')) {
        const script = document.createElement('script');
        script.id = 'cast-api';
        script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
        document.body.appendChild(script);
      }
    });
  };

  const castMedia = useCallback(async (url: string, title: string, poster: string) => {
    try {
      if (isCasting) {
        toast.info('Já existe uma transmissão em andamento.');
        return;
      }
      
      const session = await initCastAndGetSession();
      if (!session) {
        toast.error('Não foi possível iniciar a sessão de espelhamento.');
        return;
      }

      const mediaInfo = new window.chrome.cast.media.MediaInfo(url, 'video/mp4');
      mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.metadataType = window.chrome.cast.media.MetadataType.GENERIC;
      mediaInfo.metadata.title = title;
      mediaInfo.metadata.images = [{ url: poster }];

      const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
      
      setIsCasting(true);
      toast.loading('Iniciando transmissão...', { id: 'cast-loading' });

      session.loadMedia(request)
        .then(() => {
          toast.dismiss('cast-loading');
          toast.success(`Transmitindo ${title} para o dispositivo.`);
        })
        .catch((e: any) => {
          toast.dismiss('cast-loading');
          toast.error('Erro ao transmitir a mídia.');
          setIsCasting(false);
          console.error(e);
        });

    } catch (error) {
      console.error('Cast error:', error);
      toast.error('Falha ao conectar ou selecionar dispositivo.');
    }
  }, [isCasting]);

  return { castMedia, isCasting };
}

declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    cast?: any;
    chrome?: any;
  }
}
