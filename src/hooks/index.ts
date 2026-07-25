import { useEffect, useRef, useState, useCallback } from 'react';

/** A ref + boolean state pair indicating if an element is in view. */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.15 }
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      });
    }, options);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, inView };
}

/** A debounced value useful for resize throttling. */
export function useDebounced<T>(value: T, delay = 150): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** Window size with debounce, SSR-safe. */
export function useWindowSize(delay = 150) {
  const [size, setSize] = useState({ w: 1024, h: 768 });
  const debounced = useDebounced(
    typeof window !== 'undefined' ? { w: window.innerWidth, h: window.innerHeight } : { w: 1024, h: 768 },
    delay
  );
  useEffect(() => {
    setSize({ w: debounced.w, h: debounced.h });
  }, [debounced]);
  return size;
}

/** rAF loop that calls a callback with a delta in ms. */
export function useRaf(callback: (dt: number, t: number) => void, active = true) {
  const cb = useRef(callback);
  cb.current = callback;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      cb.current(dt, now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/** Tracks the mouse position globally, normalized -1..1 from center. */
export function useMousePos() {
  const [pos, setPos] = useState({ x: 0, y: 0, raw: { x: 0, y: 0 } });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setPos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
        raw: { x: e.clientX, y: e.clientY },
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return pos;
}

/** Returns a copied state + helper, triggers a brief CSS pop. */
export function useCopyState(timeout = 1400) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    },
    [timeout]
  );
  return { copied, copy };
}

/** Random interval that fires callback at random intervals (for idle mascot animations). */
export function useRandomInterval(callback: () => void, min: number, max: number, active = true) {
  const cb = useRef(callback);
  cb.current = callback;
  useEffect(() => {
    if (!active) return;
    let id: number;
    const schedule = () => {
      const delay = min + Math.random() * (max - min);
      id = window.setTimeout(() => {
        cb.current();
        schedule();
      }, delay);
    };
    schedule();
    return () => window.clearTimeout(id);
  }, [min, max, active]);
}

/** prefers-reduced-motion flag */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}
