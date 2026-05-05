/**
 * @history
 * 2026-05-05 - Fix: return Object.create(photoStore) so reference changes on each
 *              store update, causing useMemo deps to recompute (fixes stale grid).
 */
import { useState, useEffect, useMemo } from 'react';
import { photoStore } from './photoStore';

export function usePhotoStore() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    return photoStore.subscribe(() => setTick(t => t + 1));
  }, []);
  // Return a wrapper whose identity changes on each store update
  // so useMemo deps that include `store` will recompute
  return useMemo(() => Object.create(photoStore), [tick]);
}
