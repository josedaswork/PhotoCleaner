import { Capacitor, registerPlugin } from '@capacitor/core';

const DirectoryPicker = registerPlugin('DirectoryPicker');

/**
 * Opens the native Android directory picker (SAF).
 * Returns the path relative to external storage (e.g. "DCIM/Camera").
 * Throws on error, returns null if cancelled.
 */
export async function pickDirectory() {
  if (!Capacitor.isNativePlatform()) return null;
  const result = await DirectoryPicker.pick();
  return result?.path || null;
}

/**
 * Check if "All Files Access" is granted (Android 11+).
 */
export async function hasAllFilesAccess() {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const result = await DirectoryPicker.checkAllFilesAccess();
    return result?.granted === true;
  } catch {
    return false;
  }
}

/**
 * Request "All Files Access" permission (opens system Settings).
 */
export async function requestAllFilesAccess() {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const result = await DirectoryPicker.requestAllFilesAccess();
    return result?.granted === true;
  } catch {
    return false;
  }
}
