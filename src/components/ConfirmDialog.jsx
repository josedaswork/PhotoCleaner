import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatSize } from '@/lib/formatSize';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, discardedPhotos }) {
  const totalSize = discardedPhotos.reduce((sum, p) => sum + p.size, 0);

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-sm rounded-3xl p-6">
        <AlertDialogHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-2"
          >
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </motion.div>
          <AlertDialogTitle className="text-center text-xl">
            Delete {discardedPhotos.length} photos?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm">
            You'll free up{' '}
            <span className="font-semibold text-foreground">
              {formatSize(totalSize)}
            </span>{' '}
            of space. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col mt-2">
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-2xl h-12 text-base font-semibold"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete {discardedPhotos.length} photos
          </AlertDialogAction>
          <AlertDialogCancel className="w-full rounded-2xl h-12 text-base mt-0">
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
