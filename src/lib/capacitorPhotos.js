/**
 * @history
 * 2026-05-05 - Feature: added deleteFile() that deletes from the real file system.
 *              Web: uses dirHandle.removeEntry() via File System Access API.
 *              Native: uses Capacitor Filesystem.deleteFile().
 */
import { Capacitor } from '@capacitor/core';

const PHOTO_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif|avif|tiff|tif|svg|raw|cr2|nef|arw|dng)$/i;
const IMAGE_MIME_PREFIXES = ['image/'];

let _Filesystem = null;
let _Directory = null;

async function getFS() {
  if (!_Filesystem) {
    const mod = await import('@capacitor/filesystem');
    _Filesystem = mod.Filesystem;
    _Directory = mod.Directory;
  }
  return { Filesystem: _Filesystem, Directory: _Directory };
}

function isImageFile(file) {
  // Check by extension
  if (PHOTO_EXTENSIONS.test(file.name)) return true;
  // Check by mime type if available
  if (file.mimeType && IMAGE_MIME_PREFIXES.some(p => file.mimeType.startsWith(p))) return true;
  return false;
}

export function isNative() {
  return Capacitor.isNativePlatform();
}

export async function scanDirectory(dirPath) {
  if (!isNative()) return [];
  try {
    const { Filesystem, Directory } = await getFS();
    const result = await Filesystem.readdir({
      path: dirPath,
      directory: Directory.ExternalStorage,
    });

    const photos = [];
    for (const file of result.files) {
      if (file.type === 'directory') continue;
      if (!isImageFile(file)) continue;

      const fullPath = `${dirPath}/${file.name}`;
      let url;
      try {
        const uriResult = await Filesystem.getUri({
          path: fullPath,
          directory: Directory.ExternalStorage,
        });
        url = Capacitor.convertFileSrc(uriResult.uri);
      } catch {
        continue; // Skip files we can't get a URI for
      }

      photos.push({
        name: file.name,
        size: file.size || 0,
        path: fullPath,
        folder: dirPath,
        url,
        nativePath: fullPath,
        lastModified: file.mtime || 0,
      });
    }
    // Sort chronologically (oldest first)
    photos.sort((a, b) => a.lastModified - b.lastModified);
    return photos;
  } catch (e) {
    console.warn(`Failed to scan ${dirPath}:`, e);
    return [];
  }
}

/**
 * Recursively scan a root path and all subdirectories.
 * Returns { folderPath: photos[] } for each folder that contains images.
 * onProgress callback receives (scannedFolders, foundPhotos).
 */
export async function scanDirectoryRecursive(rootPath, onProgress) {
  if (!isNative()) return {};
  const folders = {};
  let scannedCount = 0;
  let photoCount = 0;

  async function scanRecursive(dirPath, depth) {
    if (depth > 10) return; // Safety limit

    // Scan this directory for photos
    const photos = await scanDirectory(dirPath);
    if (photos.length > 0) {
      folders[dirPath] = photos;
      photoCount += photos.length;
    }

    scannedCount++;
    if (onProgress) onProgress(scannedCount, photoCount);

    // Find and scan subdirectories
    try {
      const { Filesystem, Directory } = await getFS();
      const contents = await Filesystem.readdir({
        path: dirPath,
        directory: Directory.ExternalStorage,
      });
      for (const item of contents.files) {
        if (item.type === 'directory') {
          // Skip hidden directories and common non-photo dirs
          if (item.name.startsWith('.')) continue;
          if (item.name === 'thumbnails' || item.name === '.thumbnails') continue;
          await scanRecursive(`${dirPath}/${item.name}`, depth + 1);
        }
      }
    } catch {
      // Can't read this subdirectory, skip
    }
  }

  await scanRecursive(rootPath, 0);
  return folders;
}

export async function requestPermissions() {
  if (!isNative()) return true;
  try {
    const { Filesystem } = await getFS();
    const status = await Filesystem.requestPermissions();
    return status.publicStorage === 'granted';
  } catch {
    return false;
  }
}

/**
 * Delete a file from the file system.
 * - Native: deletes via Capacitor Filesystem.
 * - Web with File System Access API: deletes via dirHandle.removeEntry().
 * - Web fallback: revokes the blob URL (can't delete without handle).
 */
export async function deleteFile(photo) {
  // Web: use File System Access API handle if available
  if (photo.dirHandle) {
    try {
      await photo.dirHandle.removeEntry(photo.name);
    } catch (e) {
      console.warn(`Failed to delete ${photo.name} via handle:`, e);
    }
    if (photo.url) URL.revokeObjectURL(photo.url);
    return;
  }

  // Native: use Capacitor Filesystem
  if (isNative() && photo.nativePath) {
    try {
      const { Filesystem, Directory } = await getFS();
      await Filesystem.deleteFile({
        path: photo.nativePath,
        directory: Directory.ExternalStorage,
      });
    } catch (e) {
      console.warn(`Failed to delete ${photo.nativePath}:`, e);
    }
    return;
  }

  // Fallback: just revoke the blob URL
  if (photo.url) URL.revokeObjectURL(photo.url);
}
