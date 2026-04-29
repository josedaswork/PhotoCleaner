import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Capacitor before importing photoStore
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

// Mock capacitorPhotos
vi.mock('@/lib/capacitorPhotos', () => ({
  isNative: () => false,
  scanDirectory: vi.fn().mockResolvedValue([]),
}));

// localStorage mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Dynamic import so mocks are in place
let photoStore;
beforeEach(async () => {
  // Reset module between tests to get fresh state
  vi.resetModules();
  const mod = await import('@/lib/photoStore');
  photoStore = mod.photoStore;
  localStorageMock.clear();
});

describe('photoStore', () => {
  describe('subscribe / notify', () => {
    it('calls listener on loadFromInput', async () => {
      const listener = vi.fn();
      photoStore.subscribe(listener);

      const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'webkitRelativePath', { value: 'Photos/test.jpg' });

      // Mock URL.createObjectURL
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:test');

      await photoStore.loadFromInput([file]);
      expect(listener).toHaveBeenCalled();
    });

    it('unsubscribe stops notifications', async () => {
      const listener = vi.fn();
      const unsub = photoStore.subscribe(listener);
      unsub();

      const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:test');
      await photoStore.loadFromInput([file]);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('loadFromInput', () => {
    it('adds photos grouped by folder', async () => {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:photo1');

      const file = new File(['img'], 'pic.png', { type: 'image/png' });
      Object.defineProperty(file, 'webkitRelativePath', { value: 'Vacation/pic.png' });

      await photoStore.loadFromInput([file]);

      expect(photoStore.getFolderNames()).toContain('Vacation');
      expect(photoStore.getPhotos('Vacation')).toHaveLength(1);
      expect(photoStore.getPhotos('Vacation')[0].name).toBe('pic.png');
    });

    it('ignores non-image files', async () => {
      const file = new File(['text'], 'readme.txt', { type: 'text/plain' });
      await photoStore.loadFromInput([file]);

      expect(photoStore.getTotalPhotos()).toBe(0);
    });

    it('skips duplicate file names in same folder', async () => {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:dup');

      const file1 = new File(['img1'], 'pic.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file1, 'webkitRelativePath', { value: 'A/pic.jpg' });
      const file2 = new File(['img2'], 'pic.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file2, 'webkitRelativePath', { value: 'A/pic.jpg' });

      await photoStore.loadFromInput([file1, file2]);
      expect(photoStore.getPhotos('A')).toHaveLength(1);
    });

    it('uses "Selected Photos" folder when no relative path', async () => {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:sel');

      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      // No webkitRelativePath → falls back to file.name
      await photoStore.loadFromInput([file]);

      expect(photoStore.getFolderNames()).toContain('Selected Photos');
    });
  });

  describe('decisions', () => {
    it('stores and retrieves decisions per folder', () => {
      photoStore.setDecisions('MyFolder', { 'url1': 'keep', 'url2': 'discard' });
      const d = photoStore.getDecisions('MyFolder');
      expect(d['url1']).toBe('keep');
      expect(d['url2']).toBe('discard');
    });

    it('returns empty object for unknown folder', () => {
      expect(photoStore.getDecisions('nope')).toEqual({});
    });

    it('clearDecisions removes decisions', () => {
      photoStore.setDecisions('F', { x: 'keep' });
      photoStore.clearDecisions('F');
      expect(photoStore.getDecisions('F')).toEqual({});
    });
  });

  describe('removePhotos', () => {
    it('removes specified photos and revokes blob URLs', async () => {
      const revokeObjectURL = vi.fn();
      globalThis.URL.revokeObjectURL = revokeObjectURL;
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:removeme');

      const file = new File(['img'], 'remove.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'webkitRelativePath', { value: 'Folder/remove.jpg' });
      await photoStore.loadFromInput([file]);

      const photos = photoStore.getPhotos('Folder');
      photoStore.removePhotos(photos);

      expect(photoStore.getPhotos('Folder')).toHaveLength(0);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:removeme');
    });

    it('does not revoke native paths', async () => {
      const revokeObjectURL = vi.fn();
      globalThis.URL.revokeObjectURL = revokeObjectURL;
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:native');

      const file = new File(['img'], 'native.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'webkitRelativePath', { value: 'N/native.jpg' });
      await photoStore.loadFromInput([file]);

      // Simulate native photo by setting nativePath
      const photos = photoStore.getPhotos('N');
      photos[0].nativePath = '/sdcard/native.jpg';

      photoStore.removePhotos(photos);
      expect(revokeObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('removes all folders and decisions', async () => {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:clear');
      globalThis.URL.revokeObjectURL = vi.fn();

      const file = new File(['img'], 'c.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'webkitRelativePath', { value: 'X/c.jpg' });
      await photoStore.loadFromInput([file]);
      photoStore.setDecisions('X', { 'blob:clear': 'keep' });

      photoStore.clear();

      expect(photoStore.getTotalPhotos()).toBe(0);
      expect(photoStore.getFolderNames()).toEqual([]);
      expect(photoStore.getDecisions('X')).toEqual({});
    });
  });

  describe('getTotalSize', () => {
    it('sums sizes across folders', async () => {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:size');

      const file1 = new File(['a'.repeat(100)], 'a.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file1, 'webkitRelativePath', { value: 'F1/a.jpg' });
      const file2 = new File(['b'.repeat(200)], 'b.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file2, 'webkitRelativePath', { value: 'F2/b.jpg' });

      await photoStore.loadFromInput([file1, file2]);
      expect(photoStore.getTotalSize()).toBe(300);
    });
  });
});
