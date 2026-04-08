import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Trash2, Check, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhotoStore } from '@/lib/usePhotoStore';
import { formatSize } from '@/lib/formatSize';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ConfirmDialog';
import PageTransition from '@/components/PageTransition';
import { hapticSuccess, hapticLight } from '@/lib/haptics';
import { notifyCleanupComplete } from '@/lib/notifications';
import { toast } from 'sonner';

function getImageFingerprint(imgUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 16;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      const fingerprint = [];
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(
          (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 32
        );
        fingerprint.push(gray);
      }
      resolve(fingerprint);
    };
    img.onerror = () => resolve(null);
    img.src = imgUrl;
  });
}

function hammingDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < a.length; i++) distance += Math.abs(a[i] - b[i]);
  return distance / a.length;
}

export default function Duplicates() {
  const navigate = useNavigate();
  const store = usePhotoStore();
  const folderName =
    new URLSearchParams(window.location.search).get('folder') || '';
  const photos = useMemo(() => store.getPhotos(folderName), [folderName, store]);
  const [analyzing, setAnalyzing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [groups, setGroups] = useState([]);
  const [selectedToDelete, setSelectedToDelete] = useState(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [activeGroupIndex, setActiveGroupIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function analyze() {
      setAnalyzing(true);
      const fingerprints = [];
      for (let i = 0; i < photos.length; i++) {
        if (cancelled) return;
        const fp = await getImageFingerprint(photos[i].url);
        fingerprints.push({ photo: photos[i], fingerprint: fp });
        setProgress(Math.round(((i + 1) / photos.length) * 100));
      }
      if (cancelled) return;

      const threshold = 1.2;
      const used = new Set();
      const duplicateGroups = [];
      for (let i = 0; i < fingerprints.length; i++) {
        if (used.has(i)) continue;
        const group = [fingerprints[i].photo];
        for (let j = i + 1; j < fingerprints.length; j++) {
          if (used.has(j)) continue;
          if (
            hammingDistance(
              fingerprints[i].fingerprint,
              fingerprints[j].fingerprint
            ) < threshold
          ) {
            group.push(fingerprints[j].photo);
            used.add(j);
          }
        }
        if (group.length > 1) {
          used.add(i);
          duplicateGroups.push(group);
        }
      }
      setGroups(duplicateGroups);
      setAnalyzing(false);
    }
    if (photos.length > 0) analyze();
    else setAnalyzing(false);

    return () => { cancelled = true; };
  }, [photos]);

  const photosToDelete = useMemo(
    () => photos.filter(p => selectedToDelete.has(p.url)),
    [photos, selectedToDelete]
  );
  const totalDeleteSize = photosToDelete.reduce((s, p) => s + p.size, 0);

  const toggleSelect = (url) => {
    hapticLight();
    setSelectedToDelete(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const autoSelectDuplicates = () => {
    hapticLight();
    const toDelete = new Set();
    groups.forEach(group => {
      [...group]
        .sort((a, b) => b.size - a.size)
        .slice(1)
        .forEach(p => toDelete.add(p.url));
    });
    setSelectedToDelete(toDelete);
  };

  const toggleCollapse = (gi) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(gi)) next.delete(gi);
      else next.add(gi);
      return next;
    });
  };

  const collapseAll = () => setCollapsedGroups(new Set(groups.map((_, i) => i)));
  const expandAll = () => setCollapsedGroups(new Set());

  const selectedInGroup = (group) =>
    group.filter(p => selectedToDelete.has(p.url)).length;

  const handleConfirmDelete = async () => {
    const count = photosToDelete.length;
    const size = formatSize(totalDeleteSize);
    store.removePhotos(photosToDelete);
    setShowConfirm(false);
    hapticSuccess();
    toast.success(`Deleted ${count} duplicates, freed ${size}`);
    await notifyCleanupComplete(count, size);
    navigate('/');
  };

  return (
    <PageTransition className="min-h-screen flex flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-border/50">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => navigate('/')}
          className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="text-center">
          <p className="text-sm font-semibold">Find Duplicates</p>
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
            {folderName}
          </p>
        </div>
        <div className="w-10" />
      </header>

      {/* Analyzing state */}
      {analyzing ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-10 h-10 text-primary mb-6" />
          </motion.div>
          <p className="text-base font-semibold mb-2">Analyzing photos...</p>
          <p className="text-sm text-muted-foreground mb-6">
            Looking for similar images
          </p>

          {/* Progress bar */}
          <div className="w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
        </div>
      ) : groups.length === 0 ? (
        /* No duplicates found */
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6"
          >
            <Check className="w-10 h-10 text-emerald-600" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold mb-2"
          >
            No duplicates found
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground text-center max-w-xs mb-8"
          >
            All photos in this folder appear to be unique
          </motion.p>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="rounded-2xl h-12 px-8"
          >
            Go back
          </Button>
        </div>
      ) : (
        /* Duplicate groups */
        <div className="flex-1 overflow-y-auto pb-32">
          {/* Auto-select banner */}
          <div className="px-5 py-4">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={autoSelectDuplicates}
              className="w-full text-left"
            >
              <div className="bg-violet-50 dark:bg-violet-500/10 rounded-2xl p-4 border border-violet-100 dark:border-violet-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Wand2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Auto-select duplicates</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Keep the highest quality version of each group
                    </p>
                  </div>
                </div>
              </div>
            </motion.button>
          </div>

          {/* Summary & collapse controls */}
          <div className="px-5 mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {groups.length} group{groups.length !== 1 ? 's' : ''} · {groups.reduce((s, g) => s + g.length, 0)} photos
            </p>
            <div className="flex gap-2">
              <button onClick={expandAll} className="text-xs text-primary font-medium">
                Expand all
              </button>
              <span className="text-xs text-muted-foreground">·</span>
              <button onClick={collapseAll} className="text-xs text-primary font-medium">
                Collapse all
              </button>
            </div>
          </div>

          {/* Groups */}
          <div className="px-5 space-y-4">
            {groups.map((group, gi) => {
              const isCollapsed = collapsedGroups.has(gi);
              const selectedCount = selectedInGroup(group);
              const groupSize = group.reduce((s, p) => s + p.size, 0);

              return (
                <motion.div
                  key={gi}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.06 }}
                  className="bg-card rounded-2xl border border-border/60 overflow-hidden"
                >
                  {/* Group header - clickable to collapse/expand */}
                  <button
                    onClick={() => toggleCollapse(gi)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <span className="text-xs font-bold text-muted-foreground">{gi + 1}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">
                          {group.length} similar photos
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatSize(groupSize)}
                          {selectedCount > 0 && (
                            <span className="text-red-500 ml-1.5">
                              · {selectedCount} to delete
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Mini preview when collapsed */}
                      {isCollapsed && (
                        <div className="flex -space-x-2">
                          {group.slice(0, 3).map((photo) => (
                            <img
                              key={photo.url}
                              src={photo.url}
                              alt=""
                              className="w-7 h-7 rounded-md object-cover border-2 border-card"
                            />
                          ))}
                        </div>
                      )}
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Group photos */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-3 gap-1.5 p-3 pt-0">
                          {group.map((photo) => {
                            const isSelected = selectedToDelete.has(photo.url);
                            return (
                              <motion.button
                                key={photo.url}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleSelect(photo.url)}
                                className="relative aspect-square rounded-xl overflow-hidden bg-muted"
                              >
                                <img
                                  src={photo.url}
                                  alt={photo.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                                <AnimatePresence>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="absolute inset-0 bg-red-500/30 flex items-center justify-center"
                                    >
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
                                      >
                                        <Trash2 className="w-4 h-4 text-white" />
                                      </motion.div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                                  {formatSize(photo.size)}
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      {!analyzing && groups.length > 0 && selectedToDelete.size > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border/50 safe-bottom"
        >
          <Button
            onClick={() => setShowConfirm(true)}
            className="w-full h-13 rounded-2xl text-base bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete {selectedToDelete.size} photos · {formatSize(totalDeleteSize)}
          </Button>
        </motion.div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        discardedPhotos={photosToDelete}
      />
    </PageTransition>
  );
}
