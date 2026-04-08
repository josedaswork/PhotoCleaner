import React from 'react';
import { motion } from 'framer-motion';
import { Check, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatSize } from '@/lib/formatSize';

export default function CompletionScreen({
  keptCount,
  discardedCount,
  discardedSize,
  onDone,
  onReview,
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col items-center justify-center px-6"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mb-8 shadow-lg shadow-emerald-200/50"
      >
        <motion.div
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Check className="w-12 h-12 text-emerald-600" strokeWidth={2.5} />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold mb-2"
      >
        All reviewed!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground text-center text-sm max-w-xs mb-10"
      >
        You reviewed all photos in this folder
      </motion.p>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-12 mb-10"
      >
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-4xl font-bold text-emerald-600"
          >
            {keptCount}
          </motion.p>
          <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Kept</p>
        </div>
        <div className="w-px bg-border" />
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-4xl font-bold text-red-500"
          >
            {discardedCount}
          </motion.p>
          <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">To delete</p>
        </div>
      </motion.div>

      {/* Space to free */}
      {discardedCount > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm text-muted-foreground mb-8"
        >
          Free up{' '}
          <span className="font-semibold text-foreground">
            {formatSize(discardedSize)}
          </span>
        </motion.p>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        {discardedCount > 0 && (
          <Button
            onClick={onDone}
            className="w-full h-13 rounded-2xl text-base bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete {discardedCount} photos
          </Button>
        )}
        <Button
          onClick={onReview}
          variant="outline"
          className="w-full h-13 rounded-2xl text-base"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {discardedCount > 0 ? 'Review choices' : 'Go back'}
        </Button>
      </motion.div>
    </motion.div>
  );
}
