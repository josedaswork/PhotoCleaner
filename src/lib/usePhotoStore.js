import { useState, useEffect } from 'react';
import { photoStore } from './photoStore';

export function usePhotoStore() {
  const [, setTick] = useState(0);
  useEffect(() => {
    return photoStore.subscribe(() => setTick(t => t + 1));
  }, []);
  return photoStore;
}
