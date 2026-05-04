import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X as XIcon } from 'lucide-react';

export default function PhotoGridBrowser({ open, photos, decisions, onSelect, onClose }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'undecided' | 'keep' | 'discard' | 'forever'

  const filteredPhotos = useMemo(() => {
    if (filter === 'all') return photos;
    if (filter === 'undecided') return photos.filter(p => !decisions[p.url]);
    return photos.filter(p => decisions[p.url] === filter);
  }, [photos, decisions, filter]);

  if (!open) return null;

  const undecidedCount = photos.filter(p => !decisions[p.url]).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background flex flex-col safe-top safe-bottom"
      >
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b border-border/50">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onClose}
            className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Browse photos</p>
            <p className="text-xs text-muted-foreground">
              Tap a photo to start swiping from there
            </p>
          </div>
        </header>

        {/* Filters */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto flex-shrink-0 border-b border-border/30">
          {[
            { key: 'all', label: `All (${photos.length})` },
            { key: 'undecided', label: `Pending (${undecidedCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-1 py-2">
          {filteredPhotos.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-muted-foreground">No photos</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-0.5">
              {filteredPhotos.map((photo, i) => {
                const decision = decisions[photo.url];
                return (
                  <motion.button
                    key={photo.url}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.01, 0.3) }}
                    onClick={() => onSelect(photo)}
                    className="relative aspect-square overflow-hidden bg-muted group"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {/* Decision badge */}
                    {decision && (
                      <div className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${
                        decision === 'keep' ? 'bg-emerald-500' :
                        decision === 'forever' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}>
                        {decision === 'keep' ? <Check className="w-3 h-3" /> :
                         decision === 'forever' ? '⭐' :
                         <XIcon className="w-3 h-3" />}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
