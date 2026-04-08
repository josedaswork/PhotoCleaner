import React, { useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { hapticLight, hapticMedium } from '@/lib/haptics';

export default function SwipeCard({ photo, onSwipe, isTop }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const opacity = useTransform(x, [-350, -150, 0, 150, 350], [0.3, 1, 1, 1, 0.3]);
  const scale = useTransform(x, [-300, 0, 300], [0.95, 1, 0.95]);
  const keepOpacity = useTransform(x, [0, 80, 180], [0, 0.5, 1]);
  const discardOpacity = useTransform(x, [-180, -80, 0], [1, 0.5, 0]);
  const keepScale = useTransform(x, [0, 120, 200], [0.5, 0.9, 1]);
  const discardScale = useTransform(x, [-200, -120, 0], [1, 0.9, 0.5]);
  const constraintsRef = useRef(null);
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
      animate(x, 600, { duration: 0.35, ease: [0.32, 0.72, 0, 1] });
      setTimeout(() => onSwipe('keep'), 300);
    } else if (info.offset.x < -threshold) {
      hapticMedium();
      animate(x, -600, { duration: 0.35, ease: [0.32, 0.72, 0, 1] });
      setTimeout(() => onSwipe('discard'), 300);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 600, damping: 35 });
    }
  }, [x, onSwipe]);

  if (!isTop) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4 gpu-accelerated">
        <motion.div
          initial={{ scale: 0.92, opacity: 0.4 }}
          animate={{ scale: 0.95, opacity: 0.5 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-full max-w-lg rounded-3xl overflow-hidden bg-muted shadow-lg"
        >
          <img
            src={photo.url}
            alt={photo.name}
            className="w-full h-full object-contain bg-black/5"
            draggable={false}
            loading="lazy"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={constraintsRef} className="absolute inset-0 flex items-center justify-center p-4">
      <motion.div
        style={{ x, rotate, opacity, scale }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.85}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative w-full h-full max-w-lg cursor-grab active:cursor-grabbing gpu-accelerated"
      >
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-card shadow-2xl ring-1 ring-black/5">
          <img
            src={photo.url}
            alt={photo.name}
            className="w-full h-full object-contain"
            draggable={false}
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
}
