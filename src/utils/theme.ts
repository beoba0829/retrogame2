/**
 * Theme utility — the single bridge between CSS custom properties and canvas.
 * Canvas reads these every frame so flipping data-theme instantly repaints.
 */
export type Theme = 'night' | 'day';

const cache: Record<string, string> = {};
let cacheKey = '';

/** Read a CSS custom property as a raw string from :root. */
export function cssVar(name: string): string {
  const key = `${cacheKey}:${name}`;
  if (cache[key]) return cache[key];
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  cache[key] = v;
  return v;
}

/** Read a CSS var and parse to a hex/rgba color string (passthrough). */
export function cssColor(name: string): string {
  return cssVar(name) || '#000000';
}

/** Read a CSS var as a number. */
export function cssNum(name: string): number {
  return parseFloat(cssVar(name)) || 0;
}

/** Invalidate the cache (call when theme switches). */
export function invalidateThemeCache() {
  for (const k of Object.keys(cache)) delete cache[k];
}

/** The full palette snapshot used by canvas renderers each frame. */
export interface Palette {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  star: string;
  celestial: string; // sun or moon body
  celestialGlow: string;
  celestialCradle: string; // color "eaten" out of celestial (craters / none)
  cloud: string;
  cloudShadow: string;
  mountainFar: string;
  mountainNear: string;
  mountainSnow: string;
  tree: string;
  treeLight: string;
  trunk: string;
  hillNear: string;
  hillFar: string;
  grass: string;
  grassDark: string;
  grassLight: string;
  flower1: string;
  flower2: string;
  firefly: string;
  ink: string;
  gold: string;
  goldLight: string;
  goldDark: string;
  pink: string;
  cream: string;
  isDay: boolean;
}

let cachedPalette: Palette | null = null;

/** Get the current palette snapshot. Recomputes when theme changes. */
export function palette(): Palette {
  if (cachedPalette) return cachedPalette;
  cachedPalette = {
    skyTop: cssColor('--c-sky-top'),
    skyMid: cssColor('--c-sky-mid'),
    skyBottom: cssColor('--c-sky-bottom'),
    star: cssColor('--c-star'),
    celestial: cssColor('--c-celestial'),
    celestialGlow: cssColor('--c-celestial-glow'),
    celestialCradle: cssColor('--c-celestial-cradle'),
    cloud: cssColor('--c-cloud'),
    cloudShadow: cssColor('--c-cloud-shadow'),
    mountainFar: cssColor('--c-mountain-far'),
    mountainNear: cssColor('--c-mountain-near'),
    mountainSnow: cssColor('--c-mountain-snow'),
    tree: cssColor('--c-tree'),
    treeLight: cssColor('--c-tree-light'),
    trunk: cssColor('--c-trunk'),
    hillNear: cssColor('--c-hill-near'),
    hillFar: cssColor('--c-hill-far'),
    grass: cssColor('--c-grass'),
    grassDark: cssColor('--c-grass-dark'),
    grassLight: cssColor('--c-grass-light'),
    flower1: cssColor('--c-flower1'),
    flower2: cssColor('--c-flower2'),
    firefly: cssColor('--c-firefly'),
    ink: cssColor('--c-ink'),
    gold: cssColor('--c-gold'),
    goldLight: cssColor('--c-gold-light'),
    goldDark: cssColor('--c-gold-dark'),
    pink: cssColor('--c-pink'),
    cream: cssColor('--c-cream'),
    isDay: cssVar('--c-is-day') === '1',
  };
  return cachedPalette;
}

/** Clear the palette cache (call after invalidateThemeCache on theme switch). */
export function clearPaletteCache() {
  cachedPalette = null;
}

const STORAGE_KEY = 'coinbuddy-theme';

export function loadStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'night';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'day' ? 'day' : 'night';
}

export function saveStoredTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, theme);
}
