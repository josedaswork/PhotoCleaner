import React from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, FolderOpen } from 'lucide-react';

export default function EmptyState({ onSelectFolder }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-8 shadow-sm"
      >
        <ImageIcon className="w-11 h-11 text-primary/50" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-semibold mb-2"
      >
        Select a folder
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center text-sm max-w-[260px] mb-10 leading-relaxed"
      >
        Choose a folder with photos to start cleaning up your gallery
      </motion.p>

      <motion.label
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileTap={{ scale: 0.95 }}
        className="cursor-pointer"
      >
        <div className="bg-primary text-primary-foreground px-8 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center gap-2.5">
          <FolderOpen className="w-4.5 h-4.5" />
          Browse Folder
        </div>
        <input
          type="file"
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
          onChange={onSelectFolder}
        />
      </motion.label>
    </div>
  );
}
