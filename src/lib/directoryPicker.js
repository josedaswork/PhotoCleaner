import { Capacitor, registerPlugin } from '@capacitor/core';

const DirectoryPicker = registerPlugin('DirectoryPicker');

/**
 * Opens the native Android directory picker (SAF).
 * Returns the path relative to external storage (e.g. "DCIM/Camera").
 * Returns null if cancelled or not on native.
 */
export async function pickDirectory() {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const result = await DirectoryPicker.pick();
    return result?.path || null;
  } catch {
    return null;
  }
}
