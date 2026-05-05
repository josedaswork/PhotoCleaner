/**
 * @history
 * 2026-04-29 - Cleanup: removed unused _indices, getIndex(), setIndex().
 *              currentIndex tracking moved to component-level history stack.
 * 2026-05-05 - Feature: added loadFromDirectoryHandle() for File System Access API.
 *              Stores dirHandle on each photo for real file system deletion.
 * 2026-05-05 - Fix: removePhotos is now async; calls deleteFile() to delete
 *              from disk (native via Capacitor, web via dirHandle.removeEntry).
 */
import { isNative, scanDirectory, deleteFile } from './capacitorPhotos';

const PERSIST_KEY = 'swipeclean-saved-folders';

let _folders = {};
let _listeners = [];
let _decisions = {};  // { folderName: { photoUrl: 'keep'|'discard' } }

function notify() {
  _listeners.forEach(fn => fn());
}

function saveFolderMeta() {
  const meta = {};
  for (const [name, photos] of Object.entries(_folders)) {
    meta[name] = {
      count: photos.length,
      totalSize: photos.reduce((s, p) => s + p.size, 0),
      isNative: photos.some(p => p.nativePath),
    };
  }
  localStorage.setItem(PERSIST_KEY, JSON.stringify(meta));
}

function loadFolderMeta() {
  try {
    return JSON.parse(localStorage.getItem(PERSIST_KEY)) || {};
  } catch { return {}; }
}

export const photoStore = {
  subscribe(fn) {
    _listeners.push(fn);
    return () => {
      _listeners = _listeners.filter(l => l !== fn);
    };
  },

  getFolders() {
    return _folders;
  },

  getFolderNames() {
    return Object.keys(_folders).sort();
  },

  getPhotos(folderName) {
    return _folders[folderName] || [];
  },

  getTotalPhotos() {
    return Object.values(_folders).reduce((sum, arr) => sum + arr.length, 0);
  },

  getTotalSize() {
    return Object.values(_folders).reduce(
      (sum, arr) => sum + arr.reduce((s, p) => s + p.size, 0),
      0
    );
  },

  async loadFromInput(files) {
    const allowedExtensions = /\.(jpg|jpeg|png|webp|gif|bmp|tiff|heic)$/i;

    for (const file of files) {
      if (!file.type.startsWith('image/') && !file.name.match(allowedExtensions)) continue;

      const path = file.webkitRelativePath || file.name;
      const parts = path.split('/');
      const folderName =
        parts.length > 2
          ? parts.slice(1, -1).join('/')
          : parts.length > 1
            ? parts.slice(0, -1).join('/')
            : 'Selected Photos';

      if (!_folders[folderName]) _folders[folderName] = [];

      // Avoid duplicates by name within the same folder
      if (_folders[folderName].some(p => p.name === file.name)) continue;

      const url = URL.createObjectURL(file);
      _folders[folderName].push({
        file,
        url,
        name: file.name,
        size: file.size,
        folder: folderName,
        path,
        lastModified: file.lastModified || 0,
      });
    }
    // Sort each folder chronologically (oldest first)
    for (const name of Object.keys(_folders)) {
      _folders[name].sort((a, b) => (a.lastModified || 0) - (b.lastModified || 0));
    }
    saveFolderMeta();
    notify();
  },

  /**
   * Load photos using the File System Access API (showDirectoryPicker).
   * Stores directory handles so files can be deleted from disk later.
   */
  async loadFromDirectoryHandle(dirHandle) {
    const allowedExtensions = /\.(jpg|jpeg|png|webp|gif|bmp|tiff|heic)$/i;

    async function scanDir(handle, parentPath, rootName) {
      for await (const [name, entry] of handle) {
        if (entry.kind === 'file') {
          if (!allowedExtensions.test(name)) continue;
          try {
            const file = await entry.getFile();
            const folderName = parentPath || rootName;
            if (!_folders[folderName]) _folders[folderName] = [];
            if (_folders[folderName].some(p => p.name === name)) continue;

            const url = URL.createObjectURL(file);
            _folders[folderName].push({
              file,
              url,
              name: file.name,
              size: file.size,
              folder: folderName,
              path: parentPath ? `${parentPath}/${name}` : name,
              lastModified: file.lastModified || 0,
              dirHandle: handle,   // store parent dir handle for deletion
            });
          } catch (e) {
            console.warn(`Failed to read ${name}:`, e);
          }
        } else if (entry.kind === 'directory') {
          const subPath = parentPath ? `${parentPath}/${name}` : name;
          await scanDir(entry, subPath, rootName);
        }
      }
    }

    await scanDir(dirHandle, '', dirHandle.name);

    for (const name of Object.keys(_folders)) {
      _folders[name].sort((a, b) => (a.lastModified || 0) - (b.lastModified || 0));
    }
    saveFolderMeta();
    notify();
    return this.getTotalPhotos();
  },

  async loadFromNativePaths(folderPaths) {
    for (const dirPath of folderPaths) {
      const photos = await scanDirectory(dirPath);
      if (photos.length > 0) {
        _folders[dirPath] = photos;
      }
    }
    if (Object.keys(_folders).length > 0) {
      saveFolderMeta();
      notify();
    }
  },

  async loadNativeFolders(foldersMap) {
    for (const [name, photos] of Object.entries(foldersMap)) {
      if (photos.length > 0) {
        _folders[name] = photos;
      }
    }
    saveFolderMeta();
    notify();
  },

  getSavedFolderMeta() {
    return loadFolderMeta();
  },

  async removePhotos(photosToRemove) {
    // Delete files from disk (native) or revoke blob URLs (web)
    await Promise.all(photosToRemove.map(p => deleteFile(p)));
    // Remove from in-memory store
    const urlsToRemove = new Set(photosToRemove.map(p => p.url));
    for (const folder of Object.keys(_folders)) {
      _folders[folder] = _folders[folder].filter(p => !urlsToRemove.has(p.url));
      if (_folders[folder].length === 0) delete _folders[folder];
    }
    saveFolderMeta();
    notify();
  },

  clear() {
    Object.values(_folders)
      .flat()
      .forEach(p => {
        if (!p.nativePath) URL.revokeObjectURL(p.url);
      });
    _folders = {};
    _decisions = {};
    localStorage.removeItem(PERSIST_KEY);
    notify();
  },

  getDecisions(folderName) {
    return _decisions[folderName] || {};
  },

  setDecisions(folderName, decisions) {
    _decisions[folderName] = decisions;
  },

  clearDecisions(folderName) {
    delete _decisions[folderName];
  },
};
