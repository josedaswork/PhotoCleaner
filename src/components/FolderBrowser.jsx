import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Folder, FolderOpen, Loader2, Check, ImageIcon, ChevronRight } from 'lucide-react';
import { formatSize } from '@/lib/formatSize';

const PHOTO_EXT = /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)$/i;

async function getFilesystem() {
  const mod = await import('@capacitor/filesystem');
  return { Filesystem: mod.Filesystem, Directory: mod.Directory };
}

async function listDir(path) {
  const { Filesystem, Directory } = await getFilesystem();
  try {
    const result = await Filesystem.readdir({
      path: path,
      directory: Directory.ExternalStorage,
    });
    const folders = [];
    let photoCount = 0;
    let totalSize = 0;
    for (const item of result.files) {
      if (item.type === 'directory') {
        folders.push({ name: item.name, path: `${path}/${item.name}` });
      } else if (PHOTO_EXT.test(item.name)) {
        photoCount++;
        totalSize += item.size || 0;
      }
    }
    folders.sort((a, b) => a.name.localeCompare(b.name));
    return { folders, photoCount, totalSize };
  } catch {
    return { folders: [], photoCount: 0, totalSize: 0 };
  }
}

const ROOT_DIRS = [
  { name: 'DCIM', path: 'DCIM', icon: '📷' },
  { name: 'Pictures', path: 'Pictures', icon: '🖼️' },
  { name: 'Download', path: 'Download', icon: '📥' },
  { name: 'Screenshots', path: 'Pictures/Screenshots', icon: '📱' },
  { name: 'WhatsApp Images', path: 'WhatsApp/Media/WhatsApp Images', icon: '💬' },
  { name: 'Telegram', path: 'Telegram/Telegram Images', icon: '✈️' },
];

export default function FolderBrowser({ open, onClose, onSelect }) {
  const [currentPath, setCurrentPath] = useState(null); // null = root
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rootInfo, setRootInfo] = useState({}); // { path: { photoCount, exists } }

  // Check which root dirs exist and have photos
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function checkRoots() {
      const info = {};
      for (const dir of ROOT_DIRS) {
        const result = await listDir(dir.path);
        if (!cancelled) {
          // Count recursively just one level
          let subPhotos = 0;
          for (const sub of result.folders) {
            const subResult = await listDir(sub.path);
            subPhotos += subResult.photoCount;
          }
          info[dir.path] = {
            photoCount: result.photoCount + subPhotos,
            subfolders: result.folders.length,
            exists: result.folders.length > 0 || result.photoCount > 0,
          };
          if (!cancelled) setRootInfo({ ...info });
        }
      }
    }
    checkRoots();
    return () => { cancelled = true; };
  }, [open]);

  // Navigate into a folder
  const navigateTo = async (path) => {
    setLoading(true);
    setCurrentPath(path);
    const result = await listDir(path);
    setListing(result);
    setLoading(false);
  };

  const goBack = () => {
    if (!currentPath) {
      onClose();
      return;
    }
    const parts = currentPath.split('/');
    if (parts.length <= 1) {
      setCurrentPath(null);
      setListing(null);
    } else {
      navigateTo(parts.slice(0, -1).join('/'));
    }
  };

  const handleSelect = () => {
    if (currentPath) {
      onSelect(currentPath);
      onClose();
    }
  };

  if (!open) return null;

  const pathLabel = currentPath
    ? currentPath.split('/').pop()
    : 'Select folder';

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
            onClick={goBack}
            className="p-2.5 -ml-2 rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{pathLabel}</p>
            {currentPath && (
              <p className="text-xs text-muted-foreground truncate">{currentPath}</p>
            )}
          </div>
          {currentPath && listing && listing.photoCount > 0 && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSelect}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              Select
            </motion.button>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : currentPath === null ? (
            /* Root directory list */
            <div className="px-4 py-3 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                Common photo folders
              </p>
              {ROOT_DIRS.map((dir) => {
                const info = rootInfo[dir.path];
                const exists = info?.exists;
                if (info && !exists) return null;
                return (
                  <motion.button
                    key={dir.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigateTo(dir.path)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border/50 hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-xl">{dir.icon}</span>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium">{dir.name}</p>
                      {info ? (
                        <p className="text-xs text-muted-foreground">
                          {info.photoCount > 0
                            ? `${info.photoCount} photos`
                            : 'No photos yet'}
                          {info.subfolders > 0 && ` · ${info.subfolders} subfolders`}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Checking...</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </motion.button>
                );
              })}

              {/* Manual path entry hint? No, browse-only is cleaner */}
              <div className="pt-4 px-1">
                <p className="text-xs text-muted-foreground text-center">
                  Navigate to a folder with photos and tap "Select"
                </p>
              </div>
            </div>
          ) : (
            /* Directory listing */
            <div className="px-4 py-3">
              {/* Photo count banner */}
              {listing && listing.photoCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20 mb-3"
                >
                  <ImageIcon className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {listing.photoCount} photos found
                    </p>
                    {listing.totalSize > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formatSize(listing.totalSize)}
                      </p>
                    )}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSelect}
                    className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold"
                  >
                    Select
                  </motion.button>
                </motion.div>
              )}

              {/* Subfolders */}
              {listing && listing.folders.length > 0 ? (
                <div className="space-y-1.5">
                  {listing.folders.map((folder, i) => (
                    <motion.button
                      key={folder.path}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigateTo(folder.path)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/50 transition-colors"
                    >
                      <Folder className="w-5 h-5 text-primary/70 flex-shrink-0" />
                      <p className="text-sm font-medium text-left flex-1 truncate">
                        {folder.name}
                      </p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </motion.button>
                  ))}
                </div>
              ) : listing && listing.photoCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Empty folder
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
