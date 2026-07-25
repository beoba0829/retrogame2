import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { sound } from '@/utils/sound';
import {
  type Theme,
  loadStoredTheme,
  saveStoredTheme,
  invalidateThemeCache,
  clearPaletteCache,
} from '@/utils/theme';

interface ThemeCtx {
  soundOn: boolean;
  toggleSound: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const Ctx = createContext<ThemeCtx>({
  soundOn: true,
  toggleSound: () => {},
  theme: 'night',
  toggleTheme: () => {},
});

export function UiProvider({ children }: { children: ReactNode }) {
  const [soundOn, setSoundOn] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => loadStoredTheme());

  // apply data-theme to <html> + invalidate caches whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    invalidateThemeCache();
    clearPaletteCache();
  }, [theme]);

  useEffect(() => {
    sound.setEnabled(soundOn);
  }, [soundOn]);

  // unlock audio on first user gesture
  useEffect(() => {
    const unlock = () => sound.resume();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((s) => {
      const next = !s;
      sound.setEnabled(next);
      if (next) {
        sound.resume();
        sound.confirm();
      }
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === 'night' ? 'day' : 'night';
      saveStoredTheme(next);
      sound.confirm();
      return next;
    });
  }, []);

  return (
    <Ctx.Provider value={{ soundOn, toggleSound, theme, toggleTheme }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUi() {
  return useContext(Ctx);
}
