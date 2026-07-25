import { useEffect, useState, useRef } from 'react';
import { sound } from '@/utils/sound';
import { usePrefersReducedMotion } from '@/hooks';

/**
 * Arcade power-on boot screen.
 * Plays once per session (skipped on repeat visits via sessionStorage).
 * Sequence: black -> "INSERT COIN..." -> progress fill -> "LOADING WORLD..."
 * -> CRT flicker + scanline flash -> "READY!" -> power-on reveal of the page.
 * Respects prefers-reduced-motion (shortened to a quick fade).
 */
const SESSION_KEY = 'coinbuddy-booted';

type Phase = 'insert' | 'loading' | 'flicker' | 'ready' | 'done';

export function BootScreen({ onDone }: { onDone: () => void }) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('insert');
  const [progress, setProgress] = useState(0);
  const [exit, setExit] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // Skip entirely on repeat visits in the same session.
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      doneRef.current();
      return;
    }
    sessionStorage.setItem(SESSION_KEY, '1');

    if (reduced) {
      // Minimal, fast path for reduced motion.
      const t1 = window.setTimeout(() => setPhase('ready'), 250);
      const t2 = window.setTimeout(() => {
        setExit(true);
        window.setTimeout(() => doneRef.current(), 260);
      }, 600);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }

    // Full sequence timing.
    const timers: number[] = [];
    timers.push(window.setTimeout(() => sound.powerOn(), 80));
    timers.push(window.setTimeout(() => setPhase('loading'), 700));
    timers.push(window.setTimeout(() => setPhase('flicker'), 1500));
    timers.push(window.setTimeout(() => {
      setPhase('ready');
      sound.confirm();
    }, 1750));
    timers.push(window.setTimeout(() => {
      setExit(true);
      window.setTimeout(() => doneRef.current(), 520);
    }, 2150));

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reduced]);

  // Smooth progress bar fill (eased) during insert+loading phases.
  useEffect(() => {
    if (reduced) return;
    if (phase === 'ready' || phase === 'done') return;
    startRef.current = performance.now();
    const dur = phase === 'insert' ? 700 : 800;
    const from = progress;
    const to = phase === 'insert' ? 45 : 100;
    const step = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setProgress(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduced]);

  if (exit) return null;

  const message =
    phase === 'insert' ? 'INSERT COIN...' :
    phase === 'loading' ? 'LOADING WORLD...' :
    phase === 'flicker' ? 'LOADING WORLD...' :
    phase === 'ready' ? 'READY!' : '';

  return (
    <div
      className="boot-screen fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black transition-opacity duration-500"
      style={{ opacity: exit ? 0 : 1 }}
      aria-hidden
    >
      {/* scanline flash on flicker */}
      {phase === 'flicker' && <div className="boot-flash" />}

      {/* CRT flicker overlay */}
      <div className="boot-flicker" data-on={phase === 'flicker' || phase === 'ready'} />

      {/* pixel text */}
      <div
        key={message}
        className="boot-text font-pixel text-gold text-center"
        style={{ fontSize: 'clamp(0.7rem, 2.6vw, 1.2rem)' }}
      >
        {message}
      </div>

      {/* progress bar */}
      {phase !== 'ready' && (
        <div className="boot-bar-wrap pixel-border mt-6">
          <div
            className="boot-bar-fill h-full bg-gold"
            style={{ width: `${progress}%`, transition: 'width 0.08s linear' }}
          />
        </div>
      )}

      {/* power-on reveal sweep */}
      {phase === 'ready' && <div className="boot-reveal-sweep" />}

      {/* scanlines */}
      <div className="boot-scanlines" />
    </div>
  );
}
