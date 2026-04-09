import React, { useRef, useCallback, memo } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { hapticLight, hapticMedium } from '@/lib/haptics';

const BackCard = memo(function BackCard({ photo }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 gpu-accelerated">
      <div
        className="relative w-full h-full max-w-lg rounded-3xl overflow-hidden bg-muted shadow-lg"
        style={{ transform: 'scale(0.95)', opacity: 0.5 }}
      >
        <img
          src={photo.url}
          alt={photo.name}
          className="w-full h-full object-contain bg-black/5"
          draggable={false}
          decoding="async"
        />
      </div>
    </div>
  );
});

const TopCard = memo(function TopCard({ photo, onSwipe }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const keepOpacity = useTransform(x, [0, 80, 180], [0, 0.5, 1]);
  const discardOpacity = useTransform(x, [-180, -80, 0], [1, 0.5, 0]);
  const keepScale = useTransform(x, [0, 120, 200], [0.5, 0.9, 1]);
  const discardScale = useTransform(x, [-200, -120, 0], [1, 0.9, 0.5]);
  const hasTriggeredHaptic = useRef(false);

  const handleDrag = useCallback((_, info) => {
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold && !hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = true;
      hapticLight();
    } else if (Math.abs(info.offset.x) <= threshold) {
      hasTriggeredHaptic.current = false;
    }
  }, []);

  const handleDragEnd = useCallback((_, info) => {
    hasTriggeredHaptic.current = false;
    const threshold = 120;
    if (info.offset.x > threshold) {
      hapticMedium();
      animate(x, 600, { duration: 0.25, ease: [0.32, 0.72, 0, 1] });
      setTimeout(() => onSwipe('keep'), 200);
    } else if (info.offset.x < -threshold) {
      hapticMedium();
      animate(x, -600, { duration: 0.25, ease: [0.32, 0.72, 0, 1] });
      setTimeout(() => onSwipe('discard'), 200);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 600, damping: 35 });
    }
  }, [x, onSwipe]);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <motion.div
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.85}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="relative w-full h-full max-w-lg cursor-grab active:cursor-grabbing gpu-accelerated"
      >
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-card shadow-2xl ring-1 ring-black/5">
          <img
            src={photo.url}
            alt={photo.name}
            className="w-full h-full object-contain"
            draggable={false}
            decoding="async"
          />

          {/* Keep overlay */}
          <motion.div
            style={{ opacity: keepOpacity }}
            className="absolute inset-0 bg-emerald-500/10 pointer-events-none flex items-center justify-center"
          >
            <motion.div
              style={{ scale: keepScale }}
              className="bg-emerald-500/90 text-white text-2xl font-bold px-8 py-3 rounded-2xl rotate-[-12deg] shadow-lg backdrop-blur-sm"
            >
              KEEP ✓
            </motion.div>
          </motion.div>

          {/* Discard overlay */}
          <motion.div
            style={{ opacity: discardOpacity }}
            className="absolute inset-0 bg-red-500/10 pointer-events-none flex items-center justify-center"
          >
            <motion.div
              style={{ scale: discardScale }}
              className="bg-red-500/90 text-white text-2xl font-bold px-8 py-3 rounded-2xl rotate-[12deg] shadow-lg backdrop-blur-sm"
            >
              DELETE ✕
            </motion.div>
          </motion.div>
        </div>

        {/* Photo info bar */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/50 via-black/20 to-transparent rounded-b-3xl pointer-events-none">
          <p className="text-white text-sm font-medium truncate drop-shadow-md">{photo.name}</p>
          <p className="text-white/70 text-xs mt-0.5">{photo.folder}</p>
        </div>
      </motion.div>
    </div>
  );
});

export default function SwipeCard({ photo, onSwipe, isTop }) {
  if (!isTop) return <BackCard photo={photo} />;
  return <TopCard photo={photo} onSwipe={onSwipe} />;
}
