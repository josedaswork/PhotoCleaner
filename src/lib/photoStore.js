import { isNative, scanDirectory } from './capacitorPhotos';

const PERSIST_KEY = 'swipeclean-saved-folders';

let _folders = {};
let _listeners = [];
let _decisions = {};  // { folderName: { photoUrl: 'keep'|'discard' } }
let _indices = {};    // { folderName: currentIndex }

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
      });
    }
    saveFolderMeta();
    notify();
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

  removePhotos(photosToRemove) {
    const urlsToRemove = new Set(photosToRemove.map(p => p.url));
    for (const folder of Object.keys(_folders)) {
      _folders[folder] = _folders[folder].filter(p => !urlsToRemove.has(p.url));
      if (_folders[folder].length === 0) delete _folders[folder];
    }
    photosToRemove.forEach(p => {
      if (!p.nativePath) URL.revokeObjectURL(p.url);
    });
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
    _indices = {};
    localStorage.removeItem(PERSIST_KEY);
    notify();
  },

  getDecisions(folderName) {
    return _decisions[folderName] || {};
  },

  setDecisions(folderName, decisions) {
    _decisions[folderName] = decisions;
  },

  getIndex(folderName) {
    return _indices[folderName] || 0;
  },

  setIndex(folderName, index) {
    _indices[folderName] = index;
  },

  clearDecisions(folderName) {
    delete _decisions[folderName];
    delete _indices[folderName];
  },
};
