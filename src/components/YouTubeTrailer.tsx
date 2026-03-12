import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Youtube, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  // Already a plain ID (no slashes, no dots)
  if (/^[\w-]{11}$/.test(input)) return input;
  const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([^\s&?#]+)/);
  return match?.[1] || null;
}

interface YouTubeTrailerProps {
  trailer: string;
}

export default function YouTubeTrailer({ trailer }: YouTubeTrailerProps) {
  const [open, setOpen] = useState(false);
  const videoId = extractYouTubeId(trailer);

  if (!videoId) return null;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        className="border-border text-foreground hover:bg-secondary"
      >
        {open ? <X className="w-4 h-4 mr-2" /> : <Youtube className="w-4 h-4 mr-2 text-destructive" />}
        {open ? 'Fechar Trailer' : 'Trailer'}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full overflow-hidden"
          >
            <div className="aspect-video w-full max-w-2xl rounded-xl overflow-hidden bg-secondary mt-2">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                title="Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
