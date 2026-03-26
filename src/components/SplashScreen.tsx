import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import amtechIcon from '@/assets/amtech-icon.png';

interface SplashScreenProps {
  onFinish: () => void;
  minDuration?: number;
}

const posters = [
"https://static.tvmaze.com/uploads/images/medium_portrait/610/1525272.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/163/407679.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/0/15.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/143/358967.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/490/1226764.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/477/1194981.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/498/1245275.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/0/73.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/82/206879.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/69/174906.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/189/474715.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/0/137.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/448/1121792.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/0/184.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/0/154.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/48/122260.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/587/1468637.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/445/1114097.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/444/1111710.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/164/412464.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/410/1026956.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/73/183661.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/213/532575.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/178/446544.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/178/446780.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/396/991619.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/38/95017.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/286/715906.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/473/1183640.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/486/1215694.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/487/1219631.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/0/305.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/126/316697.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/216/540157.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/126/316698.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/170/426759.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/0/350.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/499/1249019.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/419/1049994.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/81/204166.jpg"
];

function shuffleArray(array: string[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

const generateColumn = () => {
  const shuffled = shuffleArray(posters).slice(0, 12);
  return [...shuffled, ...shuffled, ...shuffled];
};

const columnsData = Array.from({ length: 12 }, () => generateColumn());

const Column = ({ images, reverse = false, duration = 30 }: { images: string[], reverse?: boolean, duration?: number }) => (
  <motion.div
    className="flex flex-col gap-1.5 sm:gap-2 w-[28vw] sm:w-[16vw] md:w-[11vw] lg:w-[9vw] xl:w-[7vw] min-w-[75px] md:min-w-[95px] shrink-0"
    animate={{ y: reverse ? ['-66.66%', '0%'] : ['0%', '-66.66%'] }}
    transition={{ repeat: Infinity, ease: 'linear', duration }}
  >
    {images.map((src, i) => (
      <img
        key={i}
        src={src}
        alt=""
        loading="lazy"
        className="w-full h-auto rounded-md sm:rounded-lg object-cover opacity-60"
        style={{ aspectRatio: '2/3' }}
      />
    ))}
  </motion.div>
);

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  const handleEnter = () => {
    setVisible(false);
    setTimeout(onFinish, 600);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08, filter: 'blur(12px)' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'hsl(224 50% 6%)' }}
        >
          {/* Moving poster columns */}
          <div className="absolute inset-0 select-none pointer-events-none flex justify-center gap-1.5 sm:gap-2 -rotate-6 scale-[1.35] md:scale-[1.3] items-start">
            {columnsData.map((colImages, index) => (
              <Column
                key={index}
                images={colImages}
                duration={35 + (index % 5) * 8}
                reverse={index % 2 !== 0}
              />
            ))}
          </div>

          {/* Dark cinematic vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(10,15,30,0.4) 0%, rgba(10,15,30,0.75) 50%, rgba(10,15,30,0.95) 100%)',
            }}
          />

          {/* Top & bottom gradient fade */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[hsl(224,50%,6%)] to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[hsl(224,50%,6%)] to-transparent pointer-events-none" />

          {/* Central content */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="relative z-10 flex flex-col items-center gap-7 md:gap-9 px-6 py-8 md:px-14 md:py-12"
          >
            {/* Logo with glow */}
            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="relative flex flex-col items-center gap-4 md:gap-5"
            >
              <div className="relative">
                {/* Animated glow behind logo */}
                <motion.div
                  animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.1, 0.95] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -inset-4 rounded-[2.5rem] blur-3xl"
                  style={{ background: 'hsl(239 84% 67% / 0.5)' }}
                />
                <img
                  src={amtechIcon}
                  alt="Xerife Player"
                  className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-[1.8rem] md:rounded-[2.2rem] shadow-2xl border border-white/10"
                />
              </div>

              <div className="text-center">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight drop-shadow-2xl mb-0.5"
                    style={{ color: 'hsl(210 40% 98%)' }}>
                  XERIFE
                </h1>
                <p className="text-sm sm:text-base md:text-xl font-bold tracking-[0.5em] uppercase drop-shadow"
                   style={{ color: 'hsl(239 84% 67%)' }}>
                  Player
                </p>
              </div>
            </motion.div>

            {/* Enter button */}
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Button
                onClick={handleEnter}
                size="lg"
                className="rounded-full h-13 md:h-15 px-9 md:px-12 text-base md:text-lg font-bold transition-all gap-2.5 group border border-white/10"
                style={{
                  background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(260 84% 60%))',
                  color: 'hsl(210 40% 98%)',
                  boxShadow: '0 0 40px hsla(239,84%,67%,0.5), 0 4px 20px rgba(0,0,0,0.4)',
                }}
              >
                <div className="flex items-center justify-center bg-white/20 rounded-full p-1.5 group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                </div>
                ENTRAR
              </Button>
            </motion.div>

            {/* Version tag */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1.2 }}
              className="text-[10px] sm:text-xs tracking-widest uppercase"
              style={{ color: 'hsl(215 20% 58%)' }}
            >
              v1.0.0 · Streaming Premium
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
