/**
 * @history
 * 2026-04-29 - Fix: removed currentIndex to prevent double-advance bug.
 *              undecidedPhotos now auto-shrinks on decision; always show [0].
 *              Added history stack for undo. Fixed counter and progress bar.
 * 2026-04-29 - Fix: replaced leftover currentIndex key reference with totalDecided.
 */
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
  const [history, setHistory] = useState([]);

  // Filter out photos that already have a decision
  const undecidedPhotos = useMemo(
    () => allPhotos.filter(p => !decisions[p.url]),
    [allPhotos, decisions]
  );

  const isComplete = undecidedPhotos.length === 0;
  const discardedPhotos = useMemo(
    () => allPhotos.filter(p => decisions[p.url] === 'discard'),
    [allPhotos, decisions]
  );
  const keptPhotos = useMemo(
    () => allPhotos.filter(p => decisions[p.url] === 'keep'),
    [allPhotos, decisions]
  );
  const foreverPhotos = useMemo(
    () => allPhotos.filter(p => decisions[p.url] === 'forever'),
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
      if (i < undecidedPhotos.length) {
        const img = new Image();
        img.src = undecidedPhotos[i].url;
      }
    }
  }, [undecidedPhotos]);

  // Persist decisions to store on change
  useEffect(() => {
    photoStore.setDecisions(folderName, decisions);
  }, [decisions, folderName]);

  const handleSwipe = useCallback(
    (direction) => {
      if (undecidedPhotos.length === 0) return;
      const photo = undecidedPhotos[0];
      setDecisions(prev => ({ ...prev, [photo.url]: direction }));
      setHistory(prev => [...prev, photo.url]);
    },
    [undecidedPhotos]
  );

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastUrl = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setDecisions(prev => {
      const next = { ...prev };
      delete next[lastUrl];
      return next;
    });
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

  const totalDecided = Object.keys(decisions).length;
  const progress = allPhotos.length > 0 ? (totalDecided / allPhotos.length) * 100 : 0;

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
              key={totalDecided}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-muted-foreground"
            >
              {totalDecided + 1} of {allPhotos.length}
              {totalDecided > 0 && ` · ${keptPhotos.length}✓ ${foreverPhotos.length}⭐ ${discardedPhotos.length}✕`}
            </motion.p>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleUndo}
          disabled={history.length === 0}
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
          foreverCount={foreverPhotos.length}
          discardedCount={discardedPhotos.length}
          discardedSize={discardedSize}
          onDone={() => setShowConfirm(true)}
          onReview={() => {
            setHistory([]);
            setDecisions({});
          }}
          onBack={() => navigate('/')}
        />
      ) : (
        <div className="flex-1 relative overflow-hidden">
          {undecidedPhotos.length > 1 && (
            <SwipeCard
              key={undecidedPhotos[1].url}
              photo={undecidedPhotos[1]}
              isTop={false}
            />
          )}
          <AnimatePresence>
            <SwipeCard
              key={undecidedPhotos[0].url}
              photo={undecidedPhotos[0]}
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

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => handleSwipe('forever')}
              className="w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center hover:bg-amber-100 active:bg-amber-200 transition-all duration-200 shadow-sm"
            >
              <span className="text-amber-500 text-lg">⭐</span>
            </motion.button>

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
