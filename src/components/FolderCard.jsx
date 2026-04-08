import React from 'react';
import { motion } from 'framer-motion';
import { Folder, ChevronRight } from 'lucide-react';
import { formatSize } from '@/lib/formatSize';

export default function FolderCard({ name, photos, onClick, index = 0 }) {
  const totalSize = photos.reduce((sum, p) => sum + p.size, 0);
  const previewPhotos = photos.slice(0, 4);

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left group touch-feedback"
    >
      <div className="bg-card rounded-2xl p-4 border border-border/50 hover:border-border hover:shadow-lg transition-all duration-300">
        <div className="flex items-center gap-4">
          {/* Thumbnail grid */}
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted grid grid-cols-2 grid-rows-2 gap-px flex-shrink-0 shadow-sm">
            {previewPhotos.map((photo, i) => (
              <img
                key={i}
                src={photo.url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ))}
            {Array.from({ length: Math.max(0, 4 - previewPhotos.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-muted" />
            ))}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-primary/60 flex-shrink-0" />
              <p className="font-medium text-sm truncate">{name}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {photos.length} photos · {formatSize(totalSize)}
            </p>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
        </div>
      </div>
    </motion.button>
  );
}
