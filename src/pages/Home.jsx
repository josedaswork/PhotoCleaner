import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, FolderOpen, Camera, Trash2, Settings } from 'lucide-react';
import { usePhotoStore } from '@/lib/usePhotoStore';
import { formatSize } from '@/lib/formatSize';
import EmptyState from '@/components/EmptyState';
import FolderCard from '@/components/FolderCard';
import PageTransition from '@/components/PageTransition';

export default function Home() {
  const store = usePhotoStore();
  const navigate = useNavigate();
  const folderNames = store.getFolderNames();
  const hasPhotos = store.getTotalPhotos() > 0;

  const handleSelectFolder = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) store.loadFromInput(files);
    e.target.value = '';
  };

  if (!hasPhotos) {
    return (
      <PageTransition className="min-h-screen flex flex-col safe-top">
        <header className="px-6 pt-14 pb-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <Camera className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SwipeClean</h1>
              <p className="text-muted-foreground text-xs mt-0.5">
                Free up space by reviewing your photos
              </p>
            </div>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors shadow-sm"
          >
            <Settings className="w-5 h-5 text-secondary-foreground" />
          </motion.button>
        </header>
        <EmptyState onSelectFolder={handleSelectFolder} />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen flex flex-col pb-8 safe-top">
      <header className="px-6 pt-14 pb-2">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <Camera className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">SwipeClean</h1>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {store.getTotalPhotos()} photos · {formatSize(store.getTotalSize())}
                </p>
              </div>
            </div>
          </motion.div>
          <div className="flex items-center gap-2">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors shadow-sm"
            >
              <Settings className="w-5 h-5 text-secondary-foreground" />
            </motion.button>
            <motion.label
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.9 }}
              className="cursor-pointer"
            >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors shadow-sm">
              <FolderOpen className="w-5 h-5 text-secondary-foreground" />
            </div>
            <input
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={handleSelectFolder}
            />
          </motion.label>
          </div>
        </div>
      </header>

      {/* Quick action - Clean all */}
      <div className="px-6 mt-6">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const firstFolder = folderNames[0];
            if (firstFolder) navigate(`/clean?folder=${encodeURIComponent(firstFolder)}`);
          }}
          className="w-full text-left"
        >
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5 border border-primary/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Start cleaning</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Swipe through {store.getTotalPhotos()} photos to decide what stays
                </p>
              </div>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Folders */}
      <div className="px-6 mt-8">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3"
        >
          Folders
        </motion.h2>
        <div className="space-y-2">
          {folderNames.map((name, index) => (
            <FolderCard
              key={name}
              name={name}
              photos={store.getPhotos(name)}
              index={index}
              onClick={() =>
                navigate(`/clean?folder=${encodeURIComponent(name)}`)
              }
            />
          ))}
        </div>
      </div>

      {/* Tools section */}
      <div className="px-6 mt-8">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3"
        >
          Tools
        </motion.h2>
        {folderNames.map((name, index) => (
          <motion.button
            key={name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.35 + index * 0.06,
              duration: 0.35,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              navigate(
                `/duplicates?folder=${encodeURIComponent(name)}`
              )
            }
            className="w-full text-left mb-2"
          >
            <div className="bg-card rounded-2xl p-4 border border-border/50 hover:border-border hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Find duplicates</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {name} · {store.getPhotos(name).length} photos
                  </p>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </PageTransition>
  );
}
