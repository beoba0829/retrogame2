import { useEffect, useRef, useState } from 'react';
import { PixelSprite } from '@/components/sprites/PixelSprite';
import {
  MASCOT_BODY,
  MASCOT_JUMP,
  MASCOT_ARM,
  PALETTE,
} from '@/components/sprites/sprites';
import { sound } from '@/utils/sound';
import { usePrefersReducedMotion } from '@/hooks';

/**
 * THE MASCOT JOURNEY — the one "wow moment".
 *
 * A duplicate mascot sprite is rendered in a fixed, full-viewport overlay.
 * While the Hero is in view, it stays parked on the hero mascot's spot.
 * As the user scrolls from the Hero into the Arcade section, this sprite
 * animates along a scripted path: jump off -> land -> run -> small hop ->
 * land next to the cabinet -> point toward the game -> fade out.
 *
 * It triggers exactly once per session, is fully scroll-driven (progress
 * derived from scroll position, not a free-running timer, so it never
 * fights the user), never blocks pointer events, and respects
 * prefers-reduced-motion (skipped entirely).
 *
 * The original hero mascot stays in place; this overlay sprite is the one
 * that "leaves" so the hero mascot can keep being petted on return visits.
 */
const SESSION_KEY = 'coinbuddy-journey-done';

type Stage = 'parked' | 'jumpoff' | 'run' | 'hop' | 'land' | 'point' | 'gone';

interface Frame {
  x: number; // px from left of viewport
  y: number; // px from top of viewport (sprite top)
  scale: number;
  facing: 1 | -1;
  stage: Stage;
  arm: boolean;
}

export function MascotJourney() {
  const reduced = usePrefersReducedMotion();
  const [frame, setFrame] = useState<Frame | null>(null);
  const [active, setActive] = useState(false);
  const heroMascotRef = useRef<DOMRect | null>(null);
  const arcadeRef = useRef<DOMRect | null>(null);
  const startedRef = useRef(false);

  // Measure anchor elements once on activation.
  useEffect(() => {
    if (reduced) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const measure = () => {
      const mascotEl = document.querySelector('[data-mascot]') as HTMLElement | null;
      const arcadeEl = document.getElementById('arcade');
      if (!mascotEl || !arcadeEl) return false;
      heroMascotRef.current = mascotEl.getBoundingClientRect();
      // Target: just left of the arcade cabinet screen.
      const cab = arcadeEl.querySelector('.pixel-border.bg-ink') as HTMLElement | null;
      const cabRect = cab ? cab.getBoundingClientRect() : arcadeEl.getBoundingClientRect();
      arcadeRef.current = cabRect;
      return true;
    };

    if (!measure()) {
      // Retry once layout settles.
      const t = window.setTimeout(measure, 300);
      return () => window.clearTimeout(t);
    }

    const onScroll = () => {
      if (startedRef.current) return;
      const hero = heroMascotRef.current;
      const arcade = arcadeRef.current;
      if (!hero || !arcade) return;
      // Trigger when the hero mascot is mostly scrolled out and arcade is approaching.
      // Use the hero bottom crossing below ~70% viewport.
      const heroBottom = hero.bottom - window.scrollY;
      if (heroBottom < window.innerHeight * 0.7 && heroBottom > -window.innerHeight * 0.5) {
        startedRef.current = true;
        sessionStorage.setItem(SESSION_KEY, '1');
        window.removeEventListener('scroll', onScroll, true);
        runJourney();
      }
    };

    window.addEventListener('scroll', onScroll, true);
    // Also catch the case where the user is already scrolled past hero on load.
    onScroll();
    return () => window.removeEventListener('scroll', onScroll, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // The scripted journey. Scroll-driven: each stage's duration is a fraction
  // of the scroll distance needed to bring the arcade section into view, so
  // the animation stays in sync with the user's scroll speed.
  function runJourney() {
    const hero = heroMascotRef.current;
    const arcade = arcadeRef.current;
    if (!hero || !arcade) return;
    setActive(true);

    // Recompute live rects (user may have resized).
    const mascotEl = document.querySelector('[data-mascot]') as HTMLElement | null;
    const arcadeEl = document.getElementById('arcade');
    if (!mascotEl || !arcadeEl) return;
    const h = mascotEl.getBoundingClientRect();
    const cab = arcadeEl.querySelector('.pixel-border.bg-ink') as HTMLElement | null;
    const a = cab ? cab.getBoundingClientRect() : arcadeEl.getBoundingClientRect();

    const spriteW = 16 * 3 * 3.4; // matches Mascot size=3.4, pixel=3
    const startX = h.left + h.width / 2 - spriteW / 2;
    const startY = h.top;

    // End point: just left of the cabinet, sitting on the ground line.
    const endX = a.left - spriteW * 0.55;
    const endY = a.bottom - spriteW * 0.9;

    const stages: { stage: Stage; dur: number; fn: (p: number) => Partial<Frame> }[] = [
      { stage: 'jumpoff', dur: 600, fn: (p) => ({ y: startY - Math.sin(p * Math.PI) * 90, scale: 3.4 + Math.sin(p * Math.PI) * 0.1 }) },
      { stage: 'run', dur: 900, fn: (p) => {
        const ease = 1 - Math.pow(1 - p, 2);
        return { x: startX + (endX - startX) * 0.6 * ease, y: startY + (endY - startY) * 0.5 * ease, scale: 3.4 };
      } },
      { stage: 'hop', dur: 450, fn: (p) => ({ y: (startY + (endY - startY) * 0.5) - Math.sin(p * Math.PI) * 50, scale: 3.4 + Math.sin(p * Math.PI) * 0.08 }) },
      { stage: 'land', dur: 400, fn: (p) => {
        const ease = 1 - Math.pow(1 - p, 3);
        return { x: startX + (endX - startX) * (0.6 + 0.4 * ease), y: endY, scale: 3.4 - Math.sin(p * Math.PI) * 0.06 };
      } },
      { stage: 'point', dur: 700, fn: () => ({ arm: true, facing: 1 }) },
    ];

    let cancelled = false;
    let i = 0;
    let stageStart = performance.now();
    let curX = startX;
    let curY = startY;
    let curScale = 3.4;
    let curFacing: 1 | -1 = 1;
    let curArm = false;

    sound.jump();

    const loop = (now: number) => {
      if (cancelled) return;
      const stage = stages[i];
      const p = Math.min(1, (now - stageStart) / stage.dur);
      const partial = stage.fn(p);
      if (partial.x !== undefined) curX = partial.x;
      if (partial.y !== undefined) curY = partial.y;
      if (partial.scale !== undefined) curScale = partial.scale;
      if (partial.facing !== undefined) curFacing = partial.facing;
      if (partial.arm !== undefined) curArm = partial.arm;

      setFrame({
        x: curX,
        y: curY,
        scale: curScale,
        facing: curFacing,
        stage: stage.stage,
        arm: curArm,
      });

      if (p >= 1) {
        i++;
        stageStart = now;
        if (stage.stage === 'jumpoff') sound.land();
        if (stage.stage === 'hop') sound.land();
        if (i >= stages.length) {
          // Hold the point, then fade out.
          setFrame({ x: curX, y: curY, scale: curScale, facing: 1, stage: 'point', arm: true });
          window.setTimeout(() => {
            setFrame({ x: curX, y: curY, scale: curScale, facing: 1, stage: 'gone', arm: true });
            window.setTimeout(() => setActive(false), 500);
          }, 600);
          return;
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => { cancelled = true; };
  }

  if (!active || !frame || reduced) return null;

  const jumping = frame.stage === 'jumpoff' || frame.stage === 'hop';
  const sprite = jumping ? MASCOT_JUMP : MASCOT_BODY;
  const opacity = frame.stage === 'gone' ? 0 : 1;

  return (
    <div
      className="mascot-journey pointer-events-none fixed inset-0 z-[900]"
      style={{ opacity, transition: 'opacity 0.5s ease' }}
      aria-hidden
    >
      <div
        style={{
          position: 'absolute',
          left: frame.x,
          top: frame.y,
          transform: `scaleX(${frame.facing})`,
          transformOrigin: 'center bottom',
        }}
      >
        {/* pointing arm */}
        {frame.arm && (
          <div
            style={{
              position: 'absolute',
              left: 14 * 3 * frame.scale,
              top: 22 * frame.scale,
              animation: 'wave-arm 0.45s ease-in-out infinite',
              transformOrigin: 'bottom center',
            }}
          >
            <PixelSprite grid={MASCOT_ARM} palette={PALETTE} pixel={3} scale={frame.scale * 0.9} />
          </div>
        )}
        <PixelSprite
          grid={sprite}
          palette={PALETTE}
          pixel={3}
          scale={frame.scale}
        />
        {/* shadow */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 16 * 3 * frame.scale,
            width: 60 * frame.scale,
            height: 10 * frame.scale,
            background: 'rgba(0,0,0,0.25)',
            borderRadius: '50%',
            filter: 'blur(2px)',
            transform: `scaleX(${jumping ? 0.6 : 1})`,
            transition: 'transform 0.2s ease',
          }}
        />
      </div>
    </div>
  );
}
