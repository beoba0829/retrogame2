import { useEffect, useState, useRef } from 'react';
import { sound } from '@/utils/sound';
import { usePrefersReducedMotion } from '@/hooks';
import { PixelSprite } from '@/components/sprites/PixelSprite';
import { COIN_FRONT, PALETTE } from '@/components/sprites/sprites';

/**
 * Arcade power-on boot screen.
 * Plays once per session (skipped on repeat visits via sessionStorage).
 * Sequence (total ~2s minimum):
 *   0.0s  fade in, INSERT COIN + coin visible, CRT flicker/scanlines, idle coin glow
 *   0.3s  "BOOTING ARCADE SYSTEM..."
 *   0.7s  progress lines appear one at a time with typewriter effect
 *   1.6s  progress bar reaches 100%
 *   1.8s  PING sound + gold flash around coin + coin sparkle
 *   1.9s  fade out begins
 *   2.0s  hero fully visible
 * The screen stays at least 2s even if the site loads sooner; if assets take
 * longer, transition waits for them. Cross-fade ~300ms into the hero.
 * Respects prefers-reduced-motion (shortened to a quick fade).
 */
const SESSION_KEY = 'coinbuddy-booted';

type Phase = 'insert' | 'booting' | 'progress' | 'ready' | 'done';

const PROGRESS_LINES = [
  '✓ Loading Pixel World...',
  '✓ Connecting Token...',
  '✓ Initializing Mascot...',
  '✓ Ready.',
];

export function BootScreen({ onDone }: { onDone: () => void }) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('insert');
  const [progress, setProgress] = useState(0);
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [exit, setExit] = useState(false);
  const [coinFlash, setCoinFlash] = useState(false);
  const [coinSparkle, setCoinSparkle] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const doneRef = useRef(onDone);
  const siteReadyRef = useRef<boolean>(true); // site loads synchronously here; flip if needed
  doneRef.current = onDone;

  // Skip entirely on repeat visits in the same session.
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      doneRef.current();
      return;
    }
    sessionStorage.setItem(SESSION_KEY, '1');

    if (reduced) {
      const t1 = window.setTimeout(() => setPhase('ready'), 200);
      const t2 = window.setTimeout(() => {
        setExit(true);
        window.setTimeout(() => doneRef.current(), 260);
      }, 500);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }

    const timers: number[] = [];

    // 0.0s: fade in already happening via CSS; INSERT COIN visible.
    // 0.3s: show booting text.
    timers.push(window.setTimeout(() => setPhase('booting'), 300));
    // 0.7s: begin progress lines.
    timers.push(window.setTimeout(() => setPhase('progress'), 700));

    // Reveal progress lines one at a time with typewriter effect.
    PROGRESS_LINES.forEach((line, i) => {
      const at = 700 + i * 230; // each line starts ~230ms apart
      timers.push(
        window.setTimeout(() => {
          typewrite(line, (out) => {
            setTypedLines((prev) => {
              if (prev[i]) return prev;
              const next = [...prev];
              next[i] = out;
              return next;
            });
          });
        }, at)
      );
    });

    // 1.6s: progress bar reaches 100% (driven by rAF effect below, but we
    // guarantee completion by setting phase to 'ready' at 1.8s).
    // 1.8s: PING + gold flash + coin sparkle.
    const finishAt = 1800;
    timers.push(
      window.setTimeout(() => {
        // Only finish if the site is ready; otherwise poll until it is.
        const tryFinish = () => {
          if (siteReadyRef.current) {
            setPhase('ready');
            sound.ping();
            setCoinFlash(true);
            setCoinSparkle(true);
            window.setTimeout(() => setCoinFlash(false), 150);
          } else {
            requestAnimationFrame(tryFinish);
          }
        };
        tryFinish();
      }, finishAt)
    );

    // 1.9s: begin fade out.
    timers.push(
      window.setTimeout(() => {
        setExit(true);
        // 300ms cross-fade, then unmount + reveal hero.
        window.setTimeout(() => doneRef.current(), 300);
      }, 1900)
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reduced]);

  // Smooth progress bar fill (eased) from 0 -> 100 over the first 1.6s.
  useEffect(() => {
    if (reduced) return;
    if (phase === 'ready' || phase === 'done') return;
    startRef.current = performance.now();
    const dur = 1600;
    const step = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setProgress(eased * 100);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, reduced]);

  if (exit && phase !== 'ready') return null;

  const bootingText = phase === 'insert' ? 'INSERT COIN' : phase === 'booting' || phase === 'progress' ? 'BOOTING ARCADE SYSTEM...' : '';

  return (
    <div
      className="boot-screen fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black"
      style={{
        opacity: exit ? 0 : 1,
        transition: 'opacity 0.3s ease-out',
        animation: 'boot-fade-in 0.5s ease-out both',
      }}
      aria-hidden
    >
      {/* CRT flicker + scanlines always on during boot */}
      <div className="boot-flicker" data-on="true" />
      <div className="boot-scanlines" />

      {/* INSERT COIN artwork with idle glow + flash + sparkle */}
      <div className="relative mb-6">
        <div
          className={coinFlash ? 'boot-coin-flash' : 'boot-coin-glow'}
          style={{ animationDuration: coinFlash ? '0.15s' : '2.4s' }}
        >
          <PixelSprite grid={COIN_FRONT} palette={PALETTE} pixel={3} scale={2.2} />
        </div>
        {coinSparkle && <div className="boot-coin-sparkle" />}
      </div>

      {/* INSERT COIN / BOOTING text */}
      {bootingText && (
        <div
          key={bootingText}
          className="boot-text font-pixel text-gold text-center"
          style={{ fontSize: 'clamp(0.7rem, 2.6vw, 1.2rem)' }}
        >
          {bootingText}
        </div>
      )}

      {/* Progress lines with typewriter effect */}
      {phase === 'progress' && (
        <div className="boot-lines font-pixel mt-6" style={{ fontSize: 'clamp(0.5rem, 1.6vw, 0.75rem)' }}>
          {PROGRESS_LINES.map((_, i) => (
            <div key={i} className="boot-line" style={{ minHeight: '1.6em' }}>
              <span style={{ visibility: typedLines[i] ? 'visible' : 'hidden' }}>
                {typedLines[i] || '\u00A0'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {phase !== 'ready' && (
        <div className="boot-bar-wrap pixel-border mt-6">
          <div
            className="boot-bar-fill h-full bg-gold"
            style={{ width: `${progress}%`, transition: 'width 0.08s linear' }}
          />
        </div>
      )}

      {/* power-on reveal sweep on ready */}
      {phase === 'ready' && <div className="boot-reveal-sweep" />}
    </div>
  );
}

/** Typewriter helper: reveals `text` one char at a time, calls back with current output. */
function typewrite(text: string, cb: (out: string) => void) {
  let i = 0;
  const step = () => {
    i++;
    cb(text.slice(0, i));
    if (i < text.length) window.setTimeout(step, 28);
  };
  step();
}
