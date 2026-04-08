let _folders = {};
let _listeners = [];

function notify() {
  _listeners.forEach(fn => fn());
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
    _folders = {};
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
            : 'Root';

      if (!_folders[folderName]) _folders[folderName] = [];

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
    notify();
  },

  removePhotos(photosToRemove) {
    const urlsToRemove = new Set(photosToRemove.map(p => p.url));
    for (const folder of Object.keys(_folders)) {
      _folders[folder] = _folders[folder].filter(p => !urlsToRemove.has(p.url));
      if (_folders[folder].length === 0) delete _folders[folder];
    }
    photosToRemove.forEach(p => URL.revokeObjectURL(p.url));
    notify();
  },

  clear() {
    Object.values(_folders)
      .flat()
      .forEach(p => URL.revokeObjectURL(p.url));
    _folders = {};
    notify();
  },
};
