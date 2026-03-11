import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import amtechIcon from '@/assets/amtech-icon.png';

interface SplashScreenProps {
  onFinish: () => void;
  minDuration?: number;
}

export default function SplashScreen({ onFinish, minDuration = 2800 }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 600);
    }, minDuration);
    return () => clearTimeout(timer);
  }, [minDuration, onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: 'linear-gradient(145deg, hsl(222 47% 8%), hsl(222 47% 14%), hsl(239 84% 12%))' }}
        >
          {/* Animated radial pulses */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 2.5, opacity: 0.08 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
              style={{ background: 'radial-gradient(circle, hsl(239 84% 67%), transparent 70%)' }}
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 3, opacity: 0.05 }}
              transition={{ duration: 2.5, ease: 'easeOut', delay: 0.3 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
              style={{ background: 'radial-gradient(circle, hsl(260 80% 60%), transparent 70%)' }}
            />
          </div>

          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/30"
              initial={{
                x: Math.random() * 300 - 150,
                y: Math.random() * 300 - 150,
                opacity: 0,
              }}
              animate={{
                y: [0, -80 - Math.random() * 60],
                opacity: [0, 0.6, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: 0.5 + i * 0.3,
                ease: 'easeOut',
              }}
              style={{
                left: `${20 + i * 12}%`,
                top: `${50 + (i % 3) * 10}%`,
              }}
            />
          ))}

          {/* Icon + Branding */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="relative z-10 flex flex-col items-center gap-5"
          >
            {/* Icon with glow ring */}
            <motion.div
              initial={{ rotate: -90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
              className="relative"
            >
              {/* Glow behind icon */}
              <motion.div
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-2xl blur-xl"
                style={{ background: 'hsl(239 84% 67% / 0.4)', transform: 'scale(1.3)' }}
              />
              <img
                src={amtechIcon}
                alt="Xerife Player"
                className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl shadow-2xl"
                style={{ boxShadow: '0 0 40px hsl(239 84% 67% / 0.3), 0 8px 32px rgba(0,0,0,0.5)' }}
              />
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
                XERIFE
              </h1>
              <motion.p
                initial={{ letterSpacing: '0em', opacity: 0 }}
                animate={{ letterSpacing: '0.35em', opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.1 }}
                className="text-sm md:text-base font-semibold text-primary mt-1"
              >
                PLAYER
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Loading bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="absolute bottom-16 w-32 h-1 rounded-full bg-muted/30 overflow-hidden"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="h-full w-1/2 rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, hsl(239 84% 67%), transparent)' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
