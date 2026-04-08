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
