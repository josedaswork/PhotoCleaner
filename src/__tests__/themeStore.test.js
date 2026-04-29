import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, configurable: true });

// Mock document.documentElement
const mockClassList = { add: vi.fn(), remove: vi.fn(), contains: vi.fn(() => false) };
const mockStyle = { setProperty: vi.fn() };
Object.defineProperty(document, 'documentElement', {
  value: { classList: mockClassList, style: mockStyle },
  configurable: true,
});

let themeStore;

beforeEach(async () => {
  vi.resetModules();
  localStorageMock.clear();
  mockClassList.add.mockClear();
  mockClassList.remove.mockClear();
  mockClassList.contains.mockClear();
  mockStyle.setProperty.mockClear();
  const mod = await import('@/lib/themeStore');
  themeStore = mod.themeStore;
});

describe('themeStore', () => {
  it('returns default settings', () => {
    const s = themeStore.get();
    expect(s.mode).toBe('light');
    expect(s.color).toBe('emerald');
  });

  it('setMode updates mode and persists', () => {
    themeStore.setMode('dark');
    expect(themeStore.get().mode).toBe('dark');
    expect(mockClassList.add).toHaveBeenCalledWith('dark');
  });

  it('setColor updates color and persists', () => {
    themeStore.setColor('blue');
    expect(themeStore.get().color).toBe('blue');
    expect(mockStyle.setProperty).toHaveBeenCalled();
  });

  it('subscribe notifies on changes', () => {
    const listener = vi.fn();
    themeStore.subscribe(listener);
    themeStore.setMode('dark');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe stops notifications', () => {
    const listener = vi.fn();
    const unsub = themeStore.subscribe(listener);
    unsub();
    themeStore.setMode('dark');
    expect(listener).not.toHaveBeenCalled();
  });

  it('init applies current settings', () => {
    themeStore.init();
    // Light mode → remove 'dark'
    expect(mockClassList.remove).toHaveBeenCalledWith('dark');
    // CSS vars set
    expect(mockStyle.setProperty).toHaveBeenCalled();
  });

  it('getPresets returns color presets', () => {
    const presets = themeStore.getPresets();
    expect(presets).toHaveProperty('emerald');
    expect(presets).toHaveProperty('blue');
    expect(presets).toHaveProperty('violet');
    expect(presets.emerald.label).toBe('Emerald');
  });
});
