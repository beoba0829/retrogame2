import { useEffect, useRef, useState } from 'react';

/**
 * Fires once when an element enters the viewport, returning a boolean.
 * Used to trigger the arcade cabinet "power-on" sequence. Unlike useInView
 * it does NOT unobserve early on false — it latches true once visible.
 */
export function useInViewOnce<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.25 }
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
          observer.disconnect();
        }
      });
    }, options);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, inView };
}
