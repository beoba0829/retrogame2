import { useEffect, useRef, useState } from 'react';
import { PixelSprite } from '@/components/sprites/PixelSprite';
import { COIN_FRONT, COIN_SIDE, PALETTE } from '@/components/sprites/sprites';
import { sound } from '@/utils/sound';
import { usePrefersReducedMotion } from '@/hooks';

/**
 * COIN MAGNET CINEMATIC — one-shot scripted moment.
 *
 * Plays automatically ~1.8s after the hero is visible, exactly once per
 * page visit (sessionStorage guard). Sequence:
 *  1. A single coin falls; mascot "notices" (looks up via lookUp flag).
 *  2. A few more coins fall with randomized timing/position.
 *  3. Mascot becomes a magnet: all coins curve toward it, rotating,
 *     leaving sparkle trails.
 *  4. On arrival: pixel sparkle burst + radial glow + light camera shake
 *     + mascot squash-and-stretch.
 *  5. "GET RICH." pixel text rises and fades.
 *  6. Returns to idle. Never loops.
 *
 * All motion is transform/opacity only, driven by one rAF loop. The overlay
 * is pointer-events:none so it never blocks hover/click/scroll. Respects
 * prefers-reduced-motion (skipped entirely).
 */

const SESSION_KEY = 'coinbuddy-magnet-played';

type Phase = 'wait' | 'first' | 'rain' | 'magnet' | 'burst' | 'message' | 'done';

interface Coin {
  id: number;
  x: number; // px
  y: number; // px
  vx: number;
  vy: number;
  rot: number; // radians
  vrot: number;
  side: boolean; // which sprite face
  size: number; // render scale
  state: 'falling' | 'magnetized' | 'done';
  // magnet curve control
  curveBias: number; // perpendicular offset for curved path
  sparkles: { x: number; y: number; life: number; max: number }[];
}

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
}

const COIN_W = 12; // grid width
const COIN_H = 11;

export function CoinMagnetCinematic() {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('wait');
  const [, force] = useState(0);
  const coinsRef = useRef<Coin[]>([]);
  const sparklesRef = useRef<Sparkle[]>([]);
  const rafRef = useRef<number>(0);
  const mascotCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const shakeRef = useRef<number>(0);
  const glowRef = useRef<number>(0);
  const squashRef = useRef<number>(0); // 0..1
  const lookUpRef = useRef<boolean>(false);
  const idRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sparkle sprite (tiny plus)
  const SPARK = [' n ', 'nnn', ' n '];

  const spawnCoin = (x: number, size = 1) => {
    const id = ++idRef.current;
    coinsRef.current.push({
      id,
      x,
      y: -40,
      vx: (Math.random() - 0.5) * 20,
      vy: 60 + Math.random() * 40,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 6,
      side: Math.random() > 0.5,
      size,
      state: 'falling',
      curveBias: (Math.random() - 0.5) * 120,
      sparkles: [],
    });
  };

  const spawnSparkle = (x: number, y: number, burst = false) => {
    if (sparklesRef.current.length > 60) return; // cap
    const ang = Math.random() * Math.PI * 2;
    const spd = burst ? 60 + Math.random() * 120 : 10 + Math.random() * 20;
    sparklesRef.current.push({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - (burst ? 30 : 0),
      life: 0,
      max: burst ? 0.6 + Math.random() * 0.4 : 0.4 + Math.random() * 0.3,
      size: burst ? 1.2 + Math.random() * 0.6 : 0.8,
    });
  };

  // Main effect: orchestrate phases + rAF loop.
  useEffect(() => {
    if (reduced) return;

    // In dev, ignore the one-shot guard so the cinematic replays on refresh.
    if (import.meta.env.DEV) {
      sessionStorage.removeItem(SESSION_KEY);
    }
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');

    if (import.meta.env.DEV) console.log('Coin Magnet mounted');

    let timers: number[] = [];
    let cancelled = false;

    const measure = () => {
      const mascotEl = document.querySelector('[data-mascot]') as HTMLElement | null;
      const container = containerRef.current;
      if (!mascotEl || !container) return false;
      const mr = mascotEl.getBoundingClientRect();
      const cr = container.getBoundingClientRect();
      mascotCenter.current = {
        x: mr.left + mr.width / 2 - cr.left,
        y: mr.top + mr.height * 0.4 - cr.top,
      };
      return true;
    };

    // Wait for the mascot element to exist before starting the cinematic.
    // The overlay container is always mounted (see render below), so
    // containerRef.current is available; we just need the mascot to paint.
    const waitForMascot = () => {
      if (cancelled) return;
      if (measure()) {
        if (import.meta.env.DEV) console.log('Mascot measured', mascotCenter.current);
        startCinematic();
      } else {
        requestAnimationFrame(waitForMascot);
      }
    };

    // Start the sequence ~1.8s after the mascot is measured.
    const startCinematic = () => {
      if (import.meta.env.DEV) console.log('Starting cinematic');
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setPhase('first');
          // Step 1: single coin
          const c = mascotCenter.current;
          spawnCoin(c.x + (Math.random() - 0.5) * 60, 1);
          lookUpRef.current = true;
          sound.tap();

          // Step 2: more coins, randomized
          timers.push(
            window.setTimeout(() => {
              if (cancelled) return;
              setPhase('rain');
              for (let i = 0; i < 5; i++) {
                const delay = i * 180 + Math.random() * 220;
                timers.push(
                  window.setTimeout(() => {
                    if (cancelled) return;
                    spawnCoin(c.x + (Math.random() - 0.5) * 260, 0.9 + Math.random() * 0.3);
                  }, delay)
                );
              }
            }, 900)
          );

          // Step 3: magnet mode
          timers.push(
            window.setTimeout(() => {
              if (cancelled) return;
              if (import.meta.env.DEV) console.log('Entering magnet phase');
              setPhase('magnet');
              sound.confirm();
              coinsRef.current.forEach((co) => {
                if (co.state === 'falling') co.state = 'magnetized';
              });
            }, 2900)
          );
        }, 1800)
      );
    };

    // Kick off the wait-for-mascot loop.
    requestAnimationFrame(waitForMascot);

    // rAF loop
    let last = performance.now();
    const loop = (now: number) => {
      if (cancelled) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const c = mascotCenter.current;
      const coins = coinsRef.current;
      const sparkles = sparklesRef.current;

      // update coins
      for (const co of coins) {
        if (co.state === 'done') continue;
        if (co.state === 'falling') {
          co.vy += 120 * dt; // gravity
          co.x += co.vx * dt;
          co.y += co.vy * dt;
          co.rot += co.vrot * dt;
        } else if (co.state === 'magnetized') {
          const dx = c.x - co.x;
          const dy = c.y - co.y;
          const dist = Math.hypot(dx, dy) || 1;
          // accelerate toward mascot with curve
          const accel = 900 + (1 - Math.min(dist / 400, 1)) * 1400;
          const nx = dx / dist;
          const ny = dy / dist;
          // perpendicular for curve
          const px = -ny;
          const py = nx;
          co.vx += (nx * accel + px * co.curveBias * 3) * dt;
          co.vy += (ny * accel + py * co.curveBias * 3) * dt;
          // damp curve as it gets close
          co.curveBias *= 0.92;
          // cap speed
          const sp = Math.hypot(co.vx, co.vy);
          const max = 700;
          if (sp > max) {
            co.vx = (co.vx / sp) * max;
            co.vy = (co.vy / sp) * max;
          }
          co.x += co.vx * dt;
          co.y += co.vy * dt;
          co.rot += co.vrot * dt * 2.5;
          co.vrot *= 0.98;
          // sparkle trail occasionally
          if (Math.random() < 0.25) spawnSparkle(co.x, co.y);
          // arrival
          if (dist < 28) {
            co.state = 'done';
            // burst sparkles
            for (let i = 0; i < 6; i++) spawnSparkle(c.x, c.y, true);
            shakeRef.current = 1;
            glowRef.current = 1;
            squashRef.current = 1;
            sound.coin();
          }
        }
      }
      // remove done coins from render
      coinsRef.current = coins.filter((co) => co.state !== 'done');

      // update sparkles
      for (const sp of sparkles) {
        sp.life += dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vy += 200 * dt; // gravity on burst
        sp.vx *= 0.96;
      }
      sparklesRef.current = sparkles.filter((sp) => sp.life < sp.max);

      // decay shake/glow/squash
      shakeRef.current = Math.max(0, shakeRef.current - dt * 3);
      glowRef.current = Math.max(0, glowRef.current - dt * 1.2);
      squashRef.current = Math.max(0, squashRef.current - dt * 2.5);

      // check all coins collected -> burst phase
      if (phase === 'magnet' && coinsRef.current.length === 0 && glowRef.current > 0.4) {
        setPhase('burst');
        timers.push(
          window.setTimeout(() => {
            if (cancelled) return;
            setPhase('message');
            timers.push(
              window.setTimeout(() => {
                if (cancelled) return;
                setPhase('done');
                lookUpRef.current = false;
                if (import.meta.env.DEV) console.log('Animation finished');
              }, 1100)
            );
          }, 350)
        );
      }

      force((n) => n + 1);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      timers.forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // re-measure on resize
  useEffect(() => {
    if (reduced) return;
    const onResize = () => {
      const mascotEl = document.querySelector('[data-mascot]') as HTMLElement | null;
      const container = containerRef.current;
      if (!mascotEl || !container) return;
      const mr = mascotEl.getBoundingClientRect();
      const cr = container.getBoundingClientRect();
      mascotCenter.current = {
        x: mr.left + mr.width / 2 - cr.left,
        y: mr.top + mr.height * 0.4 - cr.top,
      };
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [reduced]);

  if (reduced) return null;
  if (phase === 'done') return null;

  const shake = shakeRef.current;
  const shakeX = shake > 0 ? (Math.random() - 0.5) * 6 * shake : 0;
  const shakeY = shake > 0 ? (Math.random() - 0.5) * 6 * shake : 0;
  const waiting = phase === 'wait';

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      style={{
        transform: `translate(${shakeX}px, ${shakeY}px)`,
        visibility: waiting ? 'hidden' : 'visible',
      }}
      aria-hidden
    >
      {/* radial glow at mascot */}
      <div
        style={{
          position: 'absolute',
          left: mascotCenter.current.x,
          top: mascotCenter.current.y,
          width: 200,
          height: 200,
          marginLeft: -100,
          marginTop: -100,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,210,63,0.5) 0%, rgba(255,210,63,0) 70%)',
          opacity: glowRef.current,
          transition: 'opacity 0.1s linear',
          filter: 'blur(2px)',
        }}
      />

      {/* coins */}
      {coinsRef.current.map((co) => (
        <div
          key={co.id}
          style={{
            position: 'absolute',
            left: co.x,
            top: co.y,
            transform: `translate(-50%, -50%) rotate(${co.rot}rad) scale(${co.size})`,
            transformOrigin: 'center',
            willChange: 'transform, left, top',
          }}
        >
          <PixelSprite
            grid={co.side ? COIN_SIDE : COIN_FRONT}
            palette={PALETTE}
            pixel={3}
            scale={1}
          />
        </div>
      ))}

      {/* sparkles */}
      {sparklesRef.current.map((sp, i) => {
        const a = 1 - sp.life / sp.max;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: sp.x,
              top: sp.y,
              transform: `translate(-50%, -50%) scale(${sp.size * (0.5 + a * 0.5)})`,
              opacity: a,
            }}
          >
            <PixelSprite grid={SPARK} palette={PALETTE} pixel={3} scale={1} />
          </div>
        );
      })}

      {/* mascot squash-and-stretch overlay: we nudge the real mascot via a class
          on its container using a CSS variable-driven transform applied through
          a style tag on the data-mascot element. We do it imperatively to avoid
          touching Hero's layout. */}
      <SquashProxy squash={squashRef.current} lookUp={lookUpRef.current} />

      {/* GET RICH message */}
      {phase === 'message' && (
        <div
          style={{
            position: 'absolute',
            left: mascotCenter.current.x,
            top: mascotCenter.current.y - 120,
            transform: 'translateX(-50%)',
            animation: 'getrich-rise 1.1s ease-out forwards',
          }}
          className="font-pixel text-gold"
        >
          <span style={{ fontSize: 'clamp(0.8rem, 2.4vw, 1.3rem)', textShadow: '0 0 10px rgba(255,210,63,0.7), 2px 2px 0 #1a1530' }}>
            GET RICH.
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Applies a squash-and-stretch + look-up transform to the real mascot element
 * imperatively, without modifying Hero. Uses CSS custom properties so the
 * mascot's own transitions still feel natural.
 */
function SquashProxy({ squash, lookUp }: { squash: number; lookUp: boolean }) {
  useEffect(() => {
    const el = document.querySelector('[data-mascot]') as HTMLElement | null;
    if (!el) return;
    // squash: stretch vertically, squash horizontally briefly
    const sx = 1 - squash * 0.18;
    const sy = 1 + squash * 0.18;
    el.style.setProperty('--cin-sx', String(sx));
    el.style.setProperty('--cin-sy', String(sy));
    el.style.setProperty('--cin-look', lookUp ? '-6px' : '0px');
    el.style.transform = `translateY(var(--cin-look)) scale(var(--cin-sx,1), var(--cin-sy,1))`;
    el.style.transformOrigin = 'center bottom';
    el.style.transition = 'transform 0.12s ease-out';
    return () => {
      el.style.removeProperty('--cin-sx');
      el.style.removeProperty('--cin-sy');
      el.style.removeProperty('--cin-look');
      el.style.transform = '';
      el.style.transformOrigin = '';
      el.style.transition = '';
    };
  }, [squash, lookUp]);
  return null;
}
