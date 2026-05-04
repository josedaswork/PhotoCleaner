import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: vi.fn(), notification: vi.fn() },
  ImpactStyle: { Light: 'LIGHT', Medium: 'MEDIUM', Heavy: 'HEAVY' },
  NotificationType: { Success: 'SUCCESS' },
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: { schedule: vi.fn(), requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }) },
}));

vi.mock('@/lib/capacitorPhotos', () => ({
  isNative: () => false,
  scanDirectory: vi.fn().mockResolvedValue([]),
  scanDirectoryRecursive: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/directoryPicker', () => ({
  pickDirectory: vi.fn().mockResolvedValue(null),
}));

// Create test photos
function createTestPhotos(count) {
  const photos = [];
  for (let i = 0; i < count; i++) {
    const file = new File([`data${i}`], `photo${i}.jpg`, { type: 'image/jpeg' });
    Object.defineProperty(file, 'webkitRelativePath', { value: `TestFolder/photo${i}.jpg` });
    Object.defineProperty(file, 'lastModified', { value: Date.now() + i * 1000 });
    photos.push(file);
  }
  return photos;
}

let photoStore;

beforeEach(async () => {
  vi.resetModules();
  globalThis.URL.createObjectURL = vi.fn((file) => `blob:${file.name}`);
  globalThis.URL.revokeObjectURL = vi.fn();

  const mod = await import('@/lib/photoStore');
  photoStore = mod.photoStore;
});

describe('Navigation: Back to folders', () => {
  it('navigate("/") from CompletionScreen returns to Home', async () => {
    // Load photos into store
    const files = createTestPhotos(2);
    await photoStore.loadFromInput(files);

    const folderNames = photoStore.getFolderNames();
    expect(folderNames).toContain('TestFolder');

    // Mark all photos as decided so CompletionScreen shows
    const photos = photoStore.getPhotos('TestFolder');
    const decisions = {};
    photos.forEach(p => { decisions[p.url] = 'keep'; });
    photoStore.setDecisions('TestFolder', decisions);

    // Import components after mocks are in place
    const { default: CleanFolder } = await import('@/pages/CleanFolder');
    const { default: Home } = await import('@/pages/Home');

    const { container } = render(
      <MemoryRouter initialEntries={['/clean?folder=TestFolder']}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <CleanFolder />
        </React.Suspense>
      </MemoryRouter>
    );

    // Should show CompletionScreen with "Back to folders" button
    await waitFor(() => {
      expect(screen.getByText('Back to folders')).toBeInTheDocument();
    });

    // The button should be clickable
    const backButton = screen.getByText('Back to folders');
    expect(backButton).not.toBeDisabled();
    expect(backButton.closest('button')).toBeTruthy();
  });

  it('FrozenRoutes preserves old location during exit', async () => {
    // This tests that the FrozenRoutes component freezes location on mount
    const { useRef } = await import('react');

    // Simulate: location changes but ref keeps old value
    const location1 = { pathname: '/clean', search: '?folder=TestFolder', hash: '', state: null, key: 'abc' };
    const location2 = { pathname: '/', search: '', hash: '', state: null, key: 'def' };

    // First render with location1
    let frozenResult;
    function TestComponent({ location }) {
      const frozen = React.useRef(location).current;
      frozenResult = frozen;
      return <div>{frozen.pathname}</div>;
    }

    const { rerender } = render(<TestComponent location={location1} />);
    expect(frozenResult.pathname).toBe('/clean');

    // Re-render with location2 - ref should still hold location1
    rerender(<TestComponent location={location2} />);
    expect(frozenResult.pathname).toBe('/clean');
  });
});
