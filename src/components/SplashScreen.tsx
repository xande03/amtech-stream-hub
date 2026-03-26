import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import amtechIcon from '@/assets/amtech-icon.png';

interface SplashScreenProps {
  onFinish: () => void;
  minDuration?: number; // kept for interface compatibility
}

// Highly reliable static URLs from TVMaze public poster CDN that will consistently render.
const posters = [
"https://static.tvmaze.com/uploads/images/medium_portrait/610/1525272.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/163/407679.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/0/15.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/143/358967.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/490/1226764.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/477/1194981.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/498/1245275.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/0/73.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/82/206879.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/69/174906.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/189/474715.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/0/137.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/448/1121792.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/0/184.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/0/154.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/48/122260.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/587/1468637.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/445/1114097.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/444/1111710.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/164/412464.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/410/1026956.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/73/183661.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/213/532575.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/178/446544.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/178/446780.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/396/991619.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/38/95017.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/286/715906.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/473/1183640.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/486/1215694.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/487/1219631.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/0/305.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/126/316697.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/216/540157.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/126/316698.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/170/426759.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/0/350.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/499/1249019.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/419/1049994.jpg","https://static.tvmaze.com/uploads/images/medium_portrait/81/204166.jpg"
];

// Randomize arrays per column to make it organic
function shuffleArray(array: string[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

// Generate enough items per column for an infinite loop
const generateColumn = () => {
  const shuffled = shuffleArray(posters).slice(0, 15);
  return [...shuffled, ...shuffled, ...shuffled]; // loop 3x seamlessly
};

// Extremely dense grid of 15 columns
const columnsData = Array.from({ length: 15 }, () => generateColumn());

// Helper to render an infinite moving column
const Column = ({ images, reverse = false, duration = 30 }: { images: string[], reverse?: boolean, duration?: number }) => (
  <motion.div
    className="flex flex-col gap-2 sm:gap-3 w-[25vw] sm:w-[15vw] md:w-[10vw] lg:w-[8vw] xl:w-[6vw] min-w-[70px] md:min-w-[90px] shrink-0"
    animate={{ y: reverse ? ['-66.66%', '0%'] : ['0%', '-66.66%'] }}
    transition={{
      repeat: Infinity,
      ease: 'linear',
      duration: duration
    }}
  >
    {images.map((src, i) => (
      <img
        key={i}
        src={src}
        alt=""
        loading="lazy"
        // Less brightness adjustment needed since the background is now white
        className="w-full h-auto rounded-lg shadow-md object-cover brightness-105"
        style={{ aspectRatio: '2/3' }}
      />
    ))}
  </motion.div>
);

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  const handleEnter = () => {
    setVisible(false);
    setTimeout(onFinish, 600); // give time for the exit animation
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-50 overflow-hidden"
        >
          {/* Animated Background Overlay: Bright white setting with many columns */}
          <div className="absolute inset-0 select-none pointer-events-none flex justify-center gap-2 sm:gap-3 -rotate-6 scale-[1.3] md:scale-[1.25] items-start">
            {columnsData.map((colImages, index) => (
              <Column 
                key={index} 
                images={colImages} 
                duration={40 + (index % 6) * 7} 
                reverse={index % 2 !== 0} 
              />
            ))}
          </div>

          {/* Light vignette effect ONLY on the edges to fade out into white, making posters pop */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(249,250,251,0.6)_70%,rgba(249,250,251,1)_100%)] pointer-events-none" />
          
          {/* Central Glassmorphism Box to protect the text readability over the bright posters */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="relative z-10 flex flex-col items-center gap-8 md:gap-10 px-8 py-10 md:px-16 md:py-14 rounded-[2.5rem] backdrop-blur-xl bg-[#0a0f1a]/80 shadow-[0_20px_70px_rgba(0,0,0,0.6)] border border-white/20"
          >
            {/* The Logo with floating animation */}
            <motion.div
              animate={{ y: [-12, 12, -12] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="relative flex flex-col items-center gap-5 md:gap-6"
            >
              <div className="relative">
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.15, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-[2rem] blur-2xl"
                  style={{ background: 'hsl(239 84% 67%)' }}
                />
                <img
                  src={amtechIcon}
                  alt="Xerife Player"
                  className="relative w-32 h-32 md:w-44 md:h-44 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border-2 border-white/10"
                />
              </div>

              <div className="text-center">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tight drop-shadow-2xl mb-1">
                  XERIFE
                </h1>
                <p className="text-base sm:text-lg md:text-2xl font-bold tracking-[0.4em] text-primary/90 uppercase drop-shadow">
                  Player
                </p>
              </div>
            </motion.div>

            {/* The Enter Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Button
                onClick={handleEnter}
                size="lg"
                className="rounded-full h-14 md:h-16 px-10 md:px-14 text-lg md:text-xl font-bold shadow-[0_0_40px_hsla(239,84%,67%,0.6)] hover:shadow-[0_0_60px_hsla(239,84%,67%,0.9)] transition-all bg-primary hover:bg-primary/90 text-white gap-3 group"
              >
                <div className="flex items-center justify-center bg-white/20 rounded-full p-1.5 mr-1 group-hover:scale-110 transition-transform shadow-inner">
                  <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                </div>
                ENTRAR
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
