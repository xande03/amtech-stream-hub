import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useChromecast() {
  const [isCasting, setIsCasting] = useState(false);

  const initCastAndGetSession = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!window.chrome?.cast || !window.cast?.framework) {
        reject('API do Chromecast não carregada. Verifique sua conexão ou tente recarregar a página.');
        return;
      }

      const context = window.cast.framework.CastContext.getInstance();
      try {
        context.setOptions({
          receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
          resumeSavedSession: true
        });
      } catch (e) { /* already initialized */ }
      
      const session = context.getCurrentSession();
      if (session) {
        resolve(session);
        return;
      }

      context.requestSession()
        .then(() => resolve(context.getCurrentSession()))
        .catch(reject);
    });
  };

  const castMedia = useCallback(async (url: string, title: string, poster: string) => {
    try {
      const session = await initCastAndGetSession();
      if (!session) {
        toast.error('Não foi possível conectar ao dispositivo.');
        return;
      }

      // Metadata with more info for better experience
      const mediaInfo = new window.chrome.cast.media.MediaInfo(url, 'video/mp4');
      mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.metadataType = window.chrome.cast.media.MetadataType.GENERIC;
      mediaInfo.metadata.title = title;
      mediaInfo.metadata.subtitle = 'Transmitindo via Xerife Hub';
      mediaInfo.metadata.images = [{ url: poster }];

      const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
      request.autoplay = true;
      
      setIsCasting(true);
      const loadingToast = toast.loading(`Enviando ${title} para a TV...`);

      session.loadMedia(request)
        .then(() => {
          toast.dismiss(loadingToast);
          toast.success(`Transmitindo ${title}`);
          
          if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title,
              artist: 'Xerife Hub',
              artwork: [{ src: poster, sizes: '512x512', type: 'image/png' }]
            });
          }
        })
        .catch((e: any) => {
          toast.dismiss(loadingToast);
          toast.error('Ocorreu um erro ao iniciar a reprodução na TV.');
          setIsCasting(false);
          console.error('Session loadMedia error:', e);
        });

    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('Cast error:', error);
        toast.error(typeof error === 'string' ? error : 'Falha ao conectar ou selecionar dispositivo.');
      }
      setIsCasting(false);
    }
  }, []);

  return { castMedia, isCasting };
}

declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    cast?: any;
    chrome?: any;
  }
}
