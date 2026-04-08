const STORAGE_KEY = 'swipeclean-theme';

const COLOR_PRESETS = {
  emerald: { label: 'Emerald', hue: 158, sat: 64 },
  blue: { label: 'Blue', hue: 217, sat: 72 },
  violet: { label: 'Violet', hue: 263, sat: 70 },
  rose: { label: 'Rose', hue: 350, sat: 72 },
  amber: { label: 'Amber', hue: 38, sat: 92 },
  cyan: { label: 'Cyan', hue: 188, sat: 78 },
};

function getDefaults() {
  return { mode: 'light', color: 'emerald' };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...getDefaults(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return getDefaults();
}

function save(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function applyPrimary(colorKey) {
  const preset = COLOR_PRESETS[colorKey] || COLOR_PRESETS.emerald;
  const { hue, sat } = preset;
  const root = document.documentElement;
  root.style.setProperty('--primary', `${hue} ${sat}% 40%`);
  root.style.setProperty('--ring', `${hue} ${sat}% 40%`);
  root.style.setProperty('--accent', `${hue} ${Math.round(sat * 0.63)}% 94%`);
  root.style.setProperty('--accent-foreground', `${hue} ${sat}% 20%`);

  if (root.classList.contains('dark')) {
    root.style.setProperty('--primary', `${hue} ${sat}% 45%`);
    root.style.setProperty('--ring', `${hue} ${sat}% 45%`);
    root.style.setProperty('--accent', `${hue} ${Math.round(sat * 0.63)}% 16%`);
    root.style.setProperty('--accent-foreground', `${hue} ${sat}% 80%`);
  }
}

function applyMode(mode) {
  const root = document.documentElement;
  if (mode === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

let _listeners = [];
let _settings = load();

export const themeStore = {
  get() { return _settings; },
  getPresets() { return COLOR_PRESETS; },

  subscribe(fn) {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(l => l !== fn); };
  },

  setMode(mode) {
    _settings = { ..._settings, mode };
    save(_settings);
    applyMode(mode);
    applyPrimary(_settings.color);
    _listeners.forEach(fn => fn());
  },

  setColor(colorKey) {
    _settings = { ..._settings, color: colorKey };
    save(_settings);
    applyPrimary(colorKey);
    _listeners.forEach(fn => fn());
  },

  init() {
    applyMode(_settings.mode);
    applyPrimary(_settings.color);
  },
};
