import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, FolderOpen, Loader2 } from 'lucide-react';
import { isNative, scanDirectoryRecursive, requestPermissions } from '@/lib/capacitorPhotos';
import { pickDirectory } from '@/lib/directoryPicker';
import { photoStore } from '@/lib/photoStore';
import { toast } from 'sonner';

export default function EmptyState({ onSelectFolder, savedMeta }) {
  const [loading, setLoading] = useState(false);
  const native = isNative();
  const hasSaved = savedMeta && Object.keys(savedMeta).length > 0;

  const handlePickFolder = async () => {
    setLoading(true);
    try {
      const granted = await requestPermissions();
      if (!granted) {
        toast.error('Storage permission required');
        setLoading(false);
        return;
      }

      const path = await pickDirectory();
      if (!path) {
        setLoading(false);
        return; // User cancelled
      }

      const folders = await scanDirectoryRecursive(path);
      const count = Object.values(folders).reduce((s, arr) => s + arr.length, 0);

      if (count > 0) {
        await photoStore.loadNativeFolders(folders);
        toast.success(`Found ${count} photos in ${Object.keys(folders).length} folder${Object.keys(folders).length > 1 ? 's' : ''}`);
      } else {
        toast.info('No photos found in this folder');
      }
    } catch (e) {
      console.error('Folder pick error:', e);
      toast.error('Error: ' + (e.message || 'Failed to open folder picker'));
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
          ? 'Select a folder from your device to start cleaning photos'
          : 'Select a folder with photos to start cleaning'}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col items-center gap-3 w-full max-w-[280px]"
      >
        {/* Android: Open native directory picker */}
        {native && (
          <button
            onClick={handlePickFolder}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2.5 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <FolderOpen className="w-4.5 h-4.5" />
            )}
            {loading ? 'Scanning...' : 'Select folder'}
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

        {/* Web: Browse folder */}
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
      </motion.div>
    </div>
  );
}
