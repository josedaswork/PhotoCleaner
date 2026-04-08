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

/**
 * Recursively scan a root path and return { folderPath: photos[] }
 * Scans the root + one level of subdirectories.
 */
export async function scanDirectoryRecursive(rootPath) {
  if (!isNative()) return {};
  const folders = {};

  // Scan root for photos
  const rootPhotos = await scanDirectory(rootPath);
  if (rootPhotos.length > 0) folders[rootPath] = rootPhotos;

  // Scan subdirectories
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const contents = await Filesystem.readdir({
      path: rootPath,
      directory: Directory.ExternalStorage,
    });
    for (const item of contents.files) {
      if (item.type === 'directory') {
        const subPath = `${rootPath}/${item.name}`;
        const photos = await scanDirectory(subPath);
        if (photos.length > 0) folders[subPath] = photos;
      }
    }
  } catch {
    // ignore
  }

  return folders;
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
