import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, FolderOpen, ScanSearch, Loader2 } from 'lucide-react';
import { isNative } from '@/lib/capacitorPhotos';
import { photoStore } from '@/lib/photoStore';
import { scanDirectory } from '@/lib/capacitorPhotos';
import FolderBrowser from '@/components/FolderBrowser';
import { toast } from 'sonner';

export default function EmptyState({ onSelectFolder, savedMeta }) {
  const [browserOpen, setBrowserOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const native = isNative();
  const hasSaved = savedMeta && Object.keys(savedMeta).length > 0;

  const handleNativeFolderSelect = async (dirPath) => {
    setLoading(true);
    try {
      const photos = await scanDirectory(dirPath);
      if (photos.length > 0) {
        await photoStore.loadNativeFolders({ [dirPath]: photos });
        toast.success(`Loaded ${photos.length} photos from ${dirPath.split('/').pop()}`);
      } else {
        toast.info('No photos found in this folder');
      }
    } catch (e) {
      toast.error('Failed to load photos');
    }
    setLoading(false);
  };

  const handleReloadSaved = async () => {
    if (!native) return;
    setLoading(true);
    const paths = Object.keys(savedMeta).filter(k => savedMeta[k].isNative);
    if (paths.length > 0) {
      await photoStore.loadFromNativePaths(paths);
      toast.success('Folders reloaded');
    }
    setLoading(false);
  };

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
        {hasSaved ? 'Welcome back' : 'Get started'}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center text-sm max-w-[280px] mb-8 leading-relaxed"
      >
        {native
          ? 'Browse your device to select a folder with photos'
          : 'Select a folder with photos to start cleaning'}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col items-center gap-3 w-full max-w-[280px]"
      >
        {/* Android: Browse folders in-app */}
        {native && (
          <button
            onClick={() => setBrowserOpen(true)}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2.5 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <ScanSearch className="w-4.5 h-4.5" />
            )}
            {loading ? 'Loading...' : 'Browse folders'}
          </button>
        )}

        {/* Android: Reload saved folders */}
        {native && hasSaved && !loading && (
          <button
            onClick={handleReloadSaved}
            className="w-full bg-accent text-accent-foreground px-6 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2.5"
          >
            <FolderOpen className="w-4.5 h-4.5" />
            Reload {Object.keys(savedMeta).length} saved folder{Object.keys(savedMeta).length > 1 ? 's' : ''}
          </button>
        )}

        {/* Web: Browse folder (webkitdirectory) */}
        {!native && (
          <label className="w-full cursor-pointer">
            <div className="w-full bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2.5">
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
          </label>
        )}

        {/* Web: show recent folders */}
        {!native && hasSaved && (
          <div className="mt-4 w-full">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 text-center">
              Recent folders
            </p>
            <div className="space-y-1.5">
              {Object.entries(savedMeta).map(([name, info]) => (
                <div key={name} className="bg-card rounded-xl px-4 py-2.5 border border-border/50 text-center">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-xs text-muted-foreground">{info.count} photos</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Folder browser overlay (Android) */}
      <FolderBrowser
        open={browserOpen}
        onClose={() => setBrowserOpen(false)}
        onSelect={handleNativeFolderSelect}
      />
    </div>
  );
}
