import { Capacitor } from '@capacitor/core';

const PHOTO_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)$/i;

export function isNative() {
  return Capacitor.isNativePlatform();
}

export async function scanDirectory(dirPath) {
  if (!isNative()) return [];
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const result = await Filesystem.readdir({
      path: dirPath,
      directory: Directory.ExternalStorage,
    });

    const photos = [];
    for (const file of result.files) {
      if (file.type === 'directory') continue;
      if (!PHOTO_EXTENSIONS.test(file.name)) continue;

      const fullPath = `${dirPath}/${file.name}`;
      const uriResult = await Filesystem.getUri({
        path: fullPath,
        directory: Directory.ExternalStorage,
      });

      photos.push({
        name: file.name,
        size: file.size || 0,
        path: fullPath,
        folder: dirPath,
        url: Capacitor.convertFileSrc(uriResult.uri),
        nativePath: fullPath,
      });
    }
    return photos;
  } catch (e) {
    console.warn(`Failed to scan ${dirPath}:`, e);
    return [];
  }
}

export async function discoverPhotoFolders() {
  if (!isNative()) return {};

  const found = {};
  const baseDirs = ['DCIM', 'Pictures', 'Download'];

  for (const base of baseDirs) {
    // Scan the base dir for photos
    const basePhotos = await scanDirectory(base);
    if (basePhotos.length > 0) found[base] = basePhotos;

    // Scan subdirectories
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const contents = await Filesystem.readdir({
        path: base,
        directory: Directory.ExternalStorage,
      });
      for (const item of contents.files) {
        if (item.type === 'directory') {
          const subPath = `${base}/${item.name}`;
          const photos = await scanDirectory(subPath);
          if (photos.length > 0) found[subPath] = photos;
        }
      }
    } catch {
      // Directory doesn't exist or no permission
    }
  }

  return found;
}

export async function requestPermissions() {
  if (!isNative()) return true;
  try {
    const { Filesystem } = await import('@capacitor/filesystem');
    const status = await Filesystem.requestPermissions();
    return status.publicStorage === 'granted';
  } catch {
    return false;
  }
}
