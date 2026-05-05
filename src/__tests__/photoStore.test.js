import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Capacitor before importing photoStore
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

// Mock capacitorPhotos
vi.mock('@/lib/capacitorPhotos', () => ({
  isNative: () => false,
  scanDirectory: vi.fn().mockResolvedValue([]),
  deleteFile: vi.fn().mockResolvedValue(undefined),
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
    it('removes specified photos and calls deleteFile', async () => {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:removeme');

      const file = new File(['img'], 'remove.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'webkitRelativePath', { value: 'Folder/remove.jpg' });
      await photoStore.loadFromInput([file]);

      const photos = photoStore.getPhotos('Folder');
      await photoStore.removePhotos(photos);

      expect(photoStore.getPhotos('Folder')).toHaveLength(0);
      const { deleteFile } = await import('@/lib/capacitorPhotos');
      expect(deleteFile).toHaveBeenCalled();
    });

    it('deleted photo paths no longer exist in any folder', async () => {
      globalThis.URL.createObjectURL = vi.fn()
        .mockReturnValueOnce('blob:a')
        .mockReturnValueOnce('blob:b')
        .mockReturnValueOnce('blob:c');

      const fileA = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
      Object.defineProperty(fileA, 'webkitRelativePath', { value: 'Pics/a.jpg' });
      const fileB = new File(['b'], 'b.jpg', { type: 'image/jpeg' });
      Object.defineProperty(fileB, 'webkitRelativePath', { value: 'Pics/b.jpg' });
      const fileC = new File(['c'], 'c.jpg', { type: 'image/jpeg' });
      Object.defineProperty(fileC, 'webkitRelativePath', { value: 'Pics/c.jpg' });
      await photoStore.loadFromInput([fileA, fileB, fileC]);

      expect(photoStore.getPhotos('Pics')).toHaveLength(3);

      // Delete only a.jpg and c.jpg
      const allPhotos = photoStore.getPhotos('Pics');
      const toDelete = allPhotos.filter(p => p.name === 'a.jpg' || p.name === 'c.jpg');
      await photoStore.removePhotos(toDelete);

      const remaining = photoStore.getPhotos('Pics');
      const remainingNames = remaining.map(p => p.name);
      const remainingUrls = remaining.map(p => p.url);

      // Deleted photos must not appear anywhere
      expect(remainingNames).not.toContain('a.jpg');
      expect(remainingNames).not.toContain('c.jpg');
      expect(remainingUrls).not.toContain('blob:a');
      expect(remainingUrls).not.toContain('blob:c');

      // Only b.jpg should remain
      expect(remaining).toHaveLength(1);
      expect(remainingNames).toContain('b.jpg');

      // No deleted photo path should exist across all folders
      const allFolderPhotos = photoStore.getFolderNames()
        .flatMap(f => photoStore.getPhotos(f));
      const allPaths = allFolderPhotos.map(p => p.url);
      expect(allPaths).not.toContain('blob:a');
      expect(allPaths).not.toContain('blob:c');
    });

    it('removes folder entirely when all photos are deleted', async () => {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:only');

      const file = new File(['img'], 'only.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'webkitRelativePath', { value: 'Solo/only.jpg' });
      await photoStore.loadFromInput([file]);

      expect(photoStore.getFolderNames()).toContain('Solo');

      await photoStore.removePhotos(photoStore.getPhotos('Solo'));

      expect(photoStore.getFolderNames()).not.toContain('Solo');
      expect(photoStore.getPhotos('Solo')).toHaveLength(0);
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

      await photoStore.removePhotos(photos);
      expect(revokeObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('loadFromDirectoryHandle + deleteFile with dirHandle', () => {
    it('loads photos from a directory handle and stores dirHandle on each photo', async () => {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:fsapi');

      const mockFile = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'lastModified', { value: 1000 });

      const fileEntry = {
        kind: 'file',
        getFile: vi.fn().mockResolvedValue(mockFile),
      };

      const mockDirHandle = {
        name: 'MyPhotos',
        [Symbol.asyncIterator]: async function* () {
          yield ['photo.jpg', fileEntry];
        },
      };

      await photoStore.loadFromDirectoryHandle(mockDirHandle);

      const photos = photoStore.getPhotos('MyPhotos');
      expect(photos).toHaveLength(1);
      expect(photos[0].name).toBe('photo.jpg');
      expect(photos[0].dirHandle).toBe(mockDirHandle);
    });

    it('deleteFile is called with photo that has dirHandle for real FS deletion', async () => {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:fsdelete');

      const removeEntry = vi.fn().mockResolvedValue(undefined);
      const mockFile = new File(['img'], 'delete-me.jpg', { type: 'image/jpeg' });

      const fileEntry = {
        kind: 'file',
        getFile: vi.fn().mockResolvedValue(mockFile),
      };

      const mockDirHandle = {
        name: 'ToDelete',
        removeEntry,
        [Symbol.asyncIterator]: async function* () {
          yield ['delete-me.jpg', fileEntry];
        },
      };

      await photoStore.loadFromDirectoryHandle(mockDirHandle);

      const photos = photoStore.getPhotos('ToDelete');
      expect(photos).toHaveLength(1);
      expect(photos[0].dirHandle).toBe(mockDirHandle);

      // deleteFile is mocked, so we verify the photo passed to it has dirHandle
      await photoStore.removePhotos(photos);

      const { deleteFile } = await import('@/lib/capacitorPhotos');
      expect(deleteFile).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'delete-me.jpg',
          dirHandle: mockDirHandle,
        })
      );
      expect(photoStore.getPhotos('ToDelete')).toHaveLength(0);
      expect(photoStore.getFolderNames()).not.toContain('ToDelete');
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
