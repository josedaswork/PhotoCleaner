import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePhotoStore } from '@/lib/usePhotoStore';
import { photoStore } from '@/lib/photoStore';
import SwipeCard from '@/components/SwipeCard';
import CompletionScreen from '@/components/CompletionScreen';
import ConfirmDialog from '@/components/ConfirmDialog';
import PageTransition from '@/components/PageTransition';
import { hapticSuccess } from '@/lib/haptics';
import { notifyCleanupComplete } from '@/lib/notifications';
import { formatSize } from '@/lib/formatSize';
import { toast } from 'sonner';

export default function CleanFolder() {
  const navigate = useNavigate();
  const store = usePhotoStore();
  const urlParams = new URLSearchParams(window.location.search);
  const folderName = urlParams.get('folder') || '';
  const allPhotos = useMemo(() => store.getPhotos(folderName), [folderName, store]);
  const [decisions, setDecisions] = useState(() => photoStore.getDecisions(folderName));
  const [showConfirm, setShowConfirm] = useState(false);

  // Filter out photos that already have a decision
  const undecidedPhotos = useMemo(
    () => allPhotos.filter(p => !decisions[p.url]),
    [allPhotos, decisions]
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const isComplete = currentIndex >= undecidedPhotos.length;
  const discardedPhotos = useMemo(
    () => allPhotos.filter(p => decisions[p.url] === 'discard'),
    [allPhotos, decisions]
  );
  const keptPhotos = useMemo(
    () => allPhotos.filter(p => decisions[p.url] === 'keep'),
    [allPhotos, decisions]
  );
  const discardedSize = discardedPhotos.reduce(
    (sum, p) => sum + p.size,
    0
  );

  // Preload upcoming images
  useEffect(() => {
    const preloadCount = 3;
    for (let i = 1; i <= preloadCount; i++) {
      const idx = currentIndex + i;
      if (idx < undecidedPhotos.length) {
        const img = new Image();
        img.src = undecidedPhotos[idx].url;
      }
    }
  }, [currentIndex, undecidedPhotos]);

  // Persist decisions to store on change
  useEffect(() => {
    photoStore.setDecisions(folderName, decisions);
    photoStore.setIndex(folderName, currentIndex);
  }, [decisions, currentIndex, folderName]);

  const handleSwipe = useCallback(
    (direction) => {
      if (currentIndex >= undecidedPhotos.length) return;
      const photo = undecidedPhotos[currentIndex];
      setDecisions(prev => ({ ...prev, [photo.url]: direction }));
      setCurrentIndex(prev => prev + 1);
    },
    [currentIndex, undecidedPhotos]
  );

  const handleUndo = () => {
    if (currentIndex <= 0) return;
    const photo = undecidedPhotos[currentIndex - 1];
    setDecisions(prev => {
      const next = { ...prev };
      delete next[photo.url];
      return next;
    });
    setCurrentIndex(prev => prev - 1);
  };

  const handleConfirmDelete = async () => {
    const count = discardedPhotos.length;
    const size = formatSize(discardedSize);
    store.removePhotos(discardedPhotos);
    photoStore.clearDecisions(folderName);
    setShowConfirm(false);
    hapticSuccess();
    toast.success(`Deleted ${count} photos, freed ${size}`);
    await notifyCleanupComplete(count, size);
    navigate('/');
  };

  const totalToReview = undecidedPhotos.length;
  const progress = totalToReview > 0 ? (currentIndex / totalToReview) * 100 : 0;
  const totalDecided = Object.keys(decisions).length;

  return (
    <PageTransition className="h-screen flex flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => navigate('/')}
          className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="text-center">
          <p className="text-sm font-semibold truncate max-w-[200px]">{folderName}</p>
          {!isComplete && (
            <motion.p
              key={currentIndex}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-muted-foreground"
            >
              {currentIndex + 1} of {totalToReview}
              {totalDecided > 0 && ` · ${keptPhotos.length}✓ ${discardedPhotos.length}✕`}
            </motion.p>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleUndo}
          disabled={currentIndex === 0}
          className="p-2.5 -mr-2 rounded-full hover:bg-secondary transition-colors disabled:opacity-30"
        >
          <RotateCcw className="w-5 h-5" />
        </motion.button>
      </header>

      {/* Progress bar */}
      {!isComplete && (
        <div className="h-1 bg-muted mx-4 rounded-full overflow-hidden flex-shrink-0">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
      )}

      {/* Main content */}
      {isComplete ? (
        <CompletionScreen
          keptCount={keptPhotos.length}
          discardedCount={discardedPhotos.length}
          discardedSize={discardedSize}
          onDone={() => setShowConfirm(true)}
          onReview={() => {
            setCurrentIndex(0);
            setDecisions({});
          }}
        />
      ) : (
        <div className="flex-1 relative overflow-hidden">
          {currentIndex + 1 < undecidedPhotos.length && (
            <SwipeCard
              key={undecidedPhotos[currentIndex + 1].url}
              photo={undecidedPhotos[currentIndex + 1]}
              isTop={false}
            />
          )}
          <AnimatePresence>
            <SwipeCard
              key={undecidedPhotos[currentIndex].url}
              photo={undecidedPhotos[currentIndex]}
              onSwipe={handleSwipe}
              isTop={true}
            />
          </AnimatePresence>
        </div>
      )}

      {/* Bottom action buttons */}
      {!isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center px-6 pb-5 pt-2 flex-shrink-0 gap-3"
        >
          <div className="flex justify-between items-center w-full px-4">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => handleSwipe('discard')}
              className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center hover:bg-red-100 active:bg-red-200 transition-all duration-200 shadow-sm"
            >
              <span className="text-red-500 text-2xl font-light">✕</span>
            </motion.button>

            <p className="text-xs text-muted-foreground font-medium">
              Swipe to decide
            </p>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => handleSwipe('keep')}
              className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center hover:bg-emerald-100 active:bg-emerald-200 transition-all duration-200 shadow-sm"
            >
              <span className="text-emerald-500 text-2xl font-light">♥</span>
            </motion.button>
          </div>

          {discardedPhotos.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white text-sm font-medium shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete {discardedPhotos.length} photo{discardedPhotos.length > 1 ? 's' : ''} · {formatSize(discardedSize)}
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        discardedPhotos={discardedPhotos}
      />
    </PageTransition>
  );
}
