import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useWindowSize, usePrefersReducedMotion } from '@/hooks';
import { palette } from '@/utils/theme';
import { sound } from '@/utils/sound';
import { MASCOT_BODY, MASCOT_JUMP } from '@/components/sprites/sprites';

/**
 * COIN DASH — an endless arcade mini-game rendered on a single canvas.
 *
 * The player IS the hero mascot sprite, drawn through a painter bound to the
 * game's own pixel scale. Facing left draws it via a flipped canvas transform.
 * The level reads palette() every frame, so flipping the site to day re-skins
 * the level too (no separate art).
 *
 * Internal logical resolution is 160 wide; GPX = floor(cssW / 160) keeps it
 * pixel-perfect at any size. Controls: arrows / A,D / Space on desktop;
 * drag-to-move + tap-to-hop on touch. Miss three coins (or eat a spike) and
 * it's over. Three coins in a row starts a double-points streak.
 *
 * The loop runs on requestAnimationFrame, auto-pauses on document.hidden and
 * on Pause / P / Esc, and suppresses screen-shake under prefers-reduced-motion.
 */

export type GameStatus = 'ready' | 'playing' | 'paused' | 'over';

export interface GameHandle {
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  /** touch control surface */
  setMove: (dir: -1 | 0 | 1) => void;
  hop: () => void;
}

export interface GameCallbacks {
  onStatus: (s: GameStatus) => void;
  onScore: (score: number) => void;
  onBest: (best: number) => void;
  onMisses: (m: number) => void;
  onCombo: (combo: number) => void;
}

const W_LOG = 160;
const BEST_KEY = 'coinbuddy-coindash-best';

interface CoinObj {
  x: number;
  y: number;
  vy: number;
  spin: number;
  sparkled: boolean;
}
interface Spike {
  x: number;
  y: number;
  vy: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}
interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

interface GameState {
  status: GameStatus;
  px: number;
  py: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  onGround: boolean;
  hopHeld: boolean;
  moveDir: -1 | 0 | 1;
  coins: CoinObj[];
  spikes: Spike[];
  particles: Particle[];
  popups: Popup[];
  score: number;
  best: number;
  misses: number;
  combo: number;
  streakPips: number;
  elapsed: number;
  spawnTimer: number;
  spikeTimer: number;
  shake: number;
  t: number;
  hLog: number;
  gpx: number;
  cloudX: number[];
  hillPhase: number;
}

export const CoinDashGame = forwardRef<GameHandle, { callbacks: GameCallbacks }>(
  function CoinDashGame({ callbacks }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { w } = useWindowSize(100);
    const reduced = usePrefersReducedMotion();

    // keyboard state lives in a ref so startGame() can clear stale keys
    const keysRef = useRef<Set<string>>(new Set());

    const gs = useRef<GameState>({
      status: 'ready',
      px: W_LOG / 2,
      py: 0,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: true,
      hopHeld: false,
      moveDir: 0,
      coins: [],
      spikes: [],
      particles: [],
      popups: [],
      score: 0,
      best: 0,
      misses: 0,
      combo: 0,
      streakPips: 0,
      elapsed: 0,
      spawnTimer: 0,
      spikeTimer: 0,
      shake: 0,
      t: 0,
      hLog: 100,
      gpx: 4,
      cloudX: [10, 60, 110],
      hillPhase: 0,
    });

    // load best score once
    useEffect(() => {
      const b = parseInt(window.localStorage.getItem(BEST_KEY) || '0', 10) || 0;
      gs.current.best = b;
      callbacks.onBest(b);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // keyboard input
    useEffect(() => {
      const keys = keysRef.current;
      const updateMove = () => {
        let dir: -1 | 0 | 1 = 0;
        if (keys.has('arrowleft') || keys.has('a')) dir = -1;
        if (keys.has('arrowright') || keys.has('d')) dir = 1;
        if (keys.has('arrowleft') && keys.has('arrowright')) dir = 0;
        gs.current.moveDir = dir;
      };
      const onDown = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'a', 'd', 'w', 's'].includes(k)) {
          e.preventDefault();
        }
        if (k === 'p' || k === 'escape') {
          togglePause();
          return;
        }
        if (k === ' ' || k === 'arrowup' || k === 'w') {
          if (gs.current.status === 'ready' || gs.current.status === 'over') {
            startGame();
          } else if (gs.current.status === 'playing') {
            doHop();
          }
          return;
        }
        keys.add(k);
        updateMove();
      };
      const onUp = (e: KeyboardEvent) => {
        keys.delete(e.key.toLowerCase());
        updateMove();
      };
      window.addEventListener('keydown', onDown, { passive: false });
      window.addEventListener('keyup', onUp);
      return () => {
        window.removeEventListener('keydown', onDown);
        window.removeEventListener('keyup', onUp);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // pause on tab hidden — also clear any held keys so the player
    // doesn't drift when focus returns
    useEffect(() => {
      const onVis = () => {
        if (document.hidden) {
          keysRef.current.clear();
          gs.current.moveDir = 0;
          if (gs.current.status === 'playing') setStatus('paused');
        }
      };
      document.addEventListener('visibilitychange', onVis);
      return () => document.removeEventListener('visibilitychange', onVis);
    }, []);

    // ---------- helpers ----------
    function setStatus(s: GameStatus) {
      gs.current.status = s;
      callbacks.onStatus(s);
    }
    function startGame() {
      const g = gs.current;
      // clear any stale keyboard state so the player never starts drifting
      keysRef.current.clear();
      g.moveDir = 0;
      g.vx = 0;
      g.px = W_LOG / 2;
      g.py = 0;
      g.vx = 0;
      g.vy = 0;
      g.coins = [];
      g.spikes = [];
      g.particles = [];
      g.popups = [];
      g.score = 0;
      g.misses = 0;
      g.combo = 0;
      g.streakPips = 0;
      g.elapsed = 0;
      g.spawnTimer = 0;
      g.spikeTimer = 0;
      g.shake = 0;
      g.facing = 1;
      callbacks.onScore(0);
      callbacks.onMisses(0);
      callbacks.onCombo(0);
      setStatus('playing');
      sound.powerOn();
    }
    function doHop() {
      const g = gs.current;
      if (g.onGround) {
        g.vy = -3.4;
        g.onGround = false;
        sound.jump();
      }
    }
    function togglePause() {
      const g = gs.current;
      keysRef.current.clear();
      g.moveDir = 0;
      if (g.status === 'playing') {
        setStatus('paused');
        sound.tap();
      } else if (g.status === 'paused') {
        setStatus('playing');
        sound.tap();
      }
    }
    function endGame() {
      const g = gs.current;
      setStatus('over');
      sound.nope();
      if (g.score > g.best) {
        g.best = g.score;
        window.localStorage.setItem(BEST_KEY, String(g.best));
        callbacks.onBest(g.best);
      }
    }
    function addParticles(x: number, y: number, color: string, n: number, spread = 2) {
      const g = gs.current;
      for (let i = 0; i < n; i++) {
        g.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * spread,
          vy: (Math.random() - 0.8) * spread,
          life: 500,
          max: 500,
          color,
          size: Math.random() > 0.5 ? 1 : 2,
        });
      }
    }
    function addPopup(x: number, y: number, text: string, color: string) {
      gs.current.popups.push({ x, y, text, life: 700, color });
    }
    function spawnCoin() {
      const g = gs.current;
      const speed = 0.5 + Math.min(1.6, g.elapsed / 30000);
      g.coins.push({
        x: 8 + Math.random() * (W_LOG - 16),
        y: -4,
        vy: speed + Math.random() * 0.3,
        spin: Math.random() * 8,
        sparkled: false,
      });
    }
    function spawnSpike() {
      const g = gs.current;
      const speed = 0.7 + Math.min(1.8, g.elapsed / 30000);
      g.spikes.push({
        x: 8 + Math.random() * (W_LOG - 16),
        y: -6,
        vy: speed + Math.random() * 0.3,
      });
    }
    function registerCatch(c: CoinObj) {
      const g = gs.current;
      g.combo += 1;
      if (g.combo >= 3) {
        g.streakPips = Math.min(3, g.streakPips + 1);
        if (g.combo === 3) addPopup(g.px, g.py - 8, 'STREAK!', '#ff5d8f');
      }
      const pts = g.streakPips > 0 ? 2 : 1;
      g.score += pts;
      callbacks.onScore(g.score);
      callbacks.onCombo(g.combo);
      addParticles(c.x, c.y, '#ffd23f', 6);
      addPopup(c.x, c.y - 2, `+${pts}`, '#ffd23f');
      sound.coin();
    }
    function registerMiss() {
      const g = gs.current;
      g.misses += 1;
      g.combo = 0;
      g.streakPips = 0;
      callbacks.onMisses(g.misses);
      callbacks.onCombo(0);
      if (!reduced) g.shake = 6;
      addParticles(g.px, g.py, '#ff5d8f', 5);
      sound.nope();
      if (g.misses >= 3) endGame();
    }
    function registerSpikeHit(s: Spike) {
      const g = gs.current;
      g.misses += 1;
      g.combo = 0;
      g.streakPips = 0;
      callbacks.onMisses(g.misses);
      callbacks.onCombo(0);
      if (!reduced) g.shake = 9;
      addParticles(s.x, s.y, '#ff3b3b', 8, 3);
      sound.nope();
      if (g.misses >= 3) endGame();
    }

    useImperativeHandle(ref, () => ({
      start: startGame,
      pause: () => { if (gs.current.status === 'playing') setStatus('paused'); },
      resume: () => { if (gs.current.status === 'paused') setStatus('playing'); },
      restart: startGame,
      setMove: (dir) => { gs.current.moveDir = dir; },
      hop: doHop,
    }));

    // ---------- main loop ----------
    useEffect(() => {
      let raf = 0;
      let last = performance.now();
      const loop = (now: number) => {
        const dt = Math.min(now - last, 50);
        last = now;
        step(dt);
        draw();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function step(dt: number) {
      const g = gs.current;
      g.t += dt;
      if (g.status !== 'playing') return;

      g.elapsed += dt;
      // difficulty ramp
      const diff = Math.min(1, g.elapsed / 30000);

      // horizontal movement
      const accel = 0.35;
      const maxSpeed = 1.6 + diff * 0.6;
      if (g.moveDir !== 0) {
        g.vx += g.moveDir * accel * (dt / 16);
        g.vx = Math.max(-maxSpeed, Math.min(maxSpeed, g.vx));
        g.facing = g.moveDir > 0 ? 1 : -1;
      } else {
        g.vx *= 0.82;
        if (Math.abs(g.vx) < 0.02) g.vx = 0;
      }
      g.px += g.vx * (dt / 16);
      // clamp to playfield
      if (g.px < 6) { g.px = 6; g.vx = 0; }
      if (g.px > W_LOG - 6) { g.px = W_LOG - 6; g.vx = 0; }

      // gravity / hop
      g.vy += 0.18 * (dt / 16);
      g.py += g.vy * (dt / 16);
      const ground = g.hLog - 18;
      if (g.py >= ground) {
        const wasAir = !g.onGround;
        g.py = ground;
        g.vy = 0;
        g.onGround = true;
        if (wasAir) {
          addParticles(g.px, g.py + 2, '#d8c9a6', 3, 1.2);
          sound.land();
        }
      }

      // spawning
      g.spawnTimer += dt;
      const coinInterval = Math.max(420, 900 - diff * 480);
      if (g.spawnTimer > coinInterval) {
        g.spawnTimer = 0;
        spawnCoin();
      }
      g.spikeTimer += dt;
      const spikeInterval = Math.max(900, 2200 - diff * 1300);
      if (g.spikeTimer > spikeInterval) {
        g.spikeTimer = 0;
        spawnSpike();
      }

      // coins
      const playerLeft = g.px - 6;
      const playerRight = g.px + 6;
      const playerTop = g.py - 14;
      const playerBottom = g.py + 2;
      g.coins = g.coins.filter((c) => {
        c.y += c.vy * (dt / 16);
        c.spin = (c.spin + dt * 0.01) % 8;
        // catch?
        if (
          c.x > playerLeft && c.x < playerRight &&
          c.y > playerTop && c.y < playerBottom
        ) {
          registerCatch(c);
          return false;
        }
        // missed (hit ground)
        if (c.y > g.hLog - 14) {
          registerMiss();
          return false;
        }
        return true;
      });

      // spikes
      g.spikes = g.spikes.filter((s) => {
        s.y += s.vy * (dt / 16);
        if (
          s.x > playerLeft - 2 && s.x < playerRight + 2 &&
          s.y > playerTop && s.y < playerBottom
        ) {
          registerSpikeHit(s);
          return false;
        }
        if (s.y > g.hLog - 10) return false;
        return true;
      });

      // particles
      g.particles = g.particles.filter((pt) => {
        pt.x += pt.vx * (dt / 16);
        pt.y += pt.vy * (dt / 16);
        pt.vy += 0.06 * (dt / 16);
        pt.life -= dt;
        return pt.life > 0;
      });
      // popups
      g.popups = g.popups.filter((pp) => {
        pp.y -= 0.4 * (dt / 16);
        pp.life -= dt;
        return pp.life > 0;
      });

      // shake decay
      if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 0.03);

      // ambient
      g.hillPhase += dt * 0.002;
      g.cloudX = g.cloudX.map((cx, i) => {
        const nx = cx + (0.08 + i * 0.02) * (dt / 16);
        return nx > W_LOG + 20 ? -20 : nx;
      });
    }

    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cssW = canvas.clientWidth || 320;
      const cssH = canvas.clientHeight || 200;
      const gpx = Math.max(2, Math.floor(cssW / W_LOG));
      gpx; // keep gpx local; we set canvas size from cssW/H
      const hLog = Math.floor(cssH / gpx);
      gs.current.hLog = hLog;
      gs.current.gpx = gpx;
      const p = palette();
      const g = gs.current;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pxW = W_LOG * gpx * dpr;
      const pxH = hLog * gpx * dpr;
      if (canvas.width !== pxW || canvas.height !== pxH) {
        canvas.width = pxW;
        canvas.height = pxH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      // the painter: draws a 1x1 logical pixel as a gpx-sized block
      const gp = (x: number, y: number, c: string, ww = 1, hh = 1) => {
        ctx.fillStyle = c;
        ctx.fillRect(Math.round(x) * gpx, Math.round(y) * gpx, ww * gpx, hh * gpx);
      };

      // screen shake offset
      const shakeX = g.shake ? (Math.random() - 0.5) * g.shake * gpx * 0.3 : 0;
      const shakeY = g.shake ? (Math.random() - 0.5) * g.shake * gpx * 0.3 : 0;
      ctx.save();
      ctx.translate(shakeX, shakeY);

      // ---------- sky ----------
      const skyGrad = ctx.createLinearGradient(0, 0, 0, hLog * gpx);
      skyGrad.addColorStop(0, p.skyTop);
      skyGrad.addColorStop(0.5, p.skyMid);
      skyGrad.addColorStop(1, p.skyBottom);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W_LOG * gpx, hLog * gpx);

      // ---------- stars (night only) ----------
      if (!p.isDay) {
        for (let i = 0; i < 24; i++) {
          const sx = (i * 37) % W_LOG;
          const sy = (i * 19) % Math.floor(hLog * 0.5);
          const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(g.t * 0.002 + i));
          ctx.fillStyle = p.star;
          ctx.globalAlpha = tw;
          gp(sx, sy, p.star);
        }
        ctx.globalAlpha = 1;
      }

      // ---------- celestial ----------
      const celX = W_LOG - 24;
      const celY = 16;
      if (p.isDay) {
        for (let r = 6; r >= 4; r--) {
          ctx.fillStyle = p.celestialGlow;
          ctx.globalAlpha = 0.18 + (6 - r) * 0.06;
          drawDisc(ctx, celX * gpx, celY * gpx, r * gpx);
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = p.celestial;
        drawDisc(ctx, celX * gpx, celY * gpx, 4 * gpx);
      } else {
        ctx.fillStyle = p.celestial;
        drawDisc(ctx, celX * gpx, celY * gpx, 4 * gpx);
        ctx.fillStyle = p.celestialCradle;
        gp(celX + 1, celY - 1, p.celestialCradle, 2, 1);
        gp(celX - 2, celY + 1, p.celestialCradle, 1, 1);
      }

      // ---------- clouds ----------
      g.cloudX.forEach((cx, i) => {
        drawCloudG(gp, cx, 10 + i * 6, p);
      });

      // ---------- far + near hills ----------
      drawHillsG(gp, 0, hLog - 28, W_LOG, 6, p.hillFar, 0.18, g.hillPhase);
      drawHillsG(gp, 0, hLog - 20, W_LOG, 8, p.hillNear, 0.14, g.hillPhase + 1);

      // ---------- ground ----------
      const groundY = hLog - 12;
      gp(0, groundY, p.grass, W_LOG, hLog - groundY);
      gp(0, groundY, p.grassDark, W_LOG, 2);
      // grass tufts
      for (let i = 0; i < W_LOG; i += 5) {
        const sw = Math.sin(g.hillPhase + i * 0.3) * 1;
        gp(i + Math.round(sw), groundY - 2, p.grassLight, 1, 2);
      }

      // ---------- coins ----------
      g.coins.forEach((c) => {
        const edge = Math.floor(c.spin) === 2 || Math.floor(c.spin) === 6;
        drawCoinG(gp, c.x, c.y, edge, p);
        // sparkle
        if (Math.floor(g.t / 200) % 4 === 0 && !c.sparkled) {
          gp(c.x + 3, c.y - 3, p.goldLight, 1, 1);
        }
      });

      // ---------- spikes ----------
      g.spikes.forEach((s) => drawSpikeG(gp, s.x, s.y, p));

      // ---------- player (mascot) ----------
      const ground = hLog - 18;
      const py = g.status === 'ready' || g.status === 'over' ? ground : g.py;
      const hopping = !g.onGround && g.status === 'playing';
      const sprite = hopping ? MASCOT_JUMP : MASCOT_BODY;
      // draw from one shared logical origin; facing only mirrors the
      // sprite pixels themselves, never the canvas coordinate system.
      drawSpriteGrid(gp, sprite, g.px - 8, py - 14, p, g.facing === -1);
      // player shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect((g.px - 5) * gpx, (ground + 2) * gpx, 10 * gpx, 2 * gpx);

      // ---------- particles ----------
      g.particles.forEach((pt) => {
        ctx.globalAlpha = Math.max(0, pt.life / pt.max);
        gp(pt.x, pt.y, pt.color, pt.size, pt.size);
      });
      ctx.globalAlpha = 1;

      // ---------- popups ----------
      g.popups.forEach((pp) => {
        ctx.globalAlpha = Math.max(0, pp.life / 700);
        drawTextG(gp, pp.x, pp.y, pp.text, pp.color, p.ink);
      });
      ctx.globalAlpha = 1;

      // ---------- streak pips ----------
      if (g.streakPips > 0) {
        for (let i = 0; i < g.streakPips; i++) {
          drawDisc(ctx, (W_LOG - 14 + i * 5) * gpx, 6 * gpx, 1.5 * gpx, p.gold);
        }
      }

      ctx.restore();

      // ---------- overlay states (drawn without shake) ----------
      if (g.status === 'ready') drawOverlay(ctx, W_LOG, hLog, gpx, p, 'COIN DASH', 'PRESS START', 'catch coins · dodge spikes · 3 misses = over');
      if (g.status === 'paused') drawOverlay(ctx, W_LOG, hLog, gpx, p, 'PAUSED', 'PRESS P / RESUME', '');
      if (g.status === 'over') {
        const lines = [`SCORE ${g.score}`, `BEST ${g.best}`];
        drawOverlay(ctx, W_LOG, hLog, gpx, p, 'GAME OVER', lines.join('   ·   '), g.score >= g.best && g.score > 0 ? 'NEW BEST! press start to retry' : 'three in the dirt. press start to retry');
      }
    }

    // touch input on the canvas
    const touchState = useRef<{ id: number | null; startX: number; lastX: number; moved: boolean }>({
      id: null, startX: 0, lastX: 0, moved: false,
    });
    const onTouchStart = (e: React.TouchEvent) => {
      if (gs.current.status !== 'playing') return;
      const t = e.changedTouches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      touchState.current = {
        id: t.identifier,
        startX: t.clientX,
        lastX: t.clientX - rect.left,
        moved: false,
      };
    };
    const onTouchMove = (e: React.TouchEvent) => {
      const ts = touchState.current;
      const t = Array.from(e.changedTouches).find((tt) => tt.identifier === ts.id);
      if (!t) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = t.clientX - rect.left;
      const dx = x - ts.lastX;
      ts.lastX = x;
      ts.moved = true;
      if (Math.abs(t.clientX - ts.startX) > 6) {
        gs.current.moveDir = dx > 0 ? 1 : -1;
      }
      e.preventDefault();
    };
    const onTouchEnd = (e: React.TouchEvent) => {
      const ts = touchState.current;
      const t = Array.from(e.changedTouches).find((tt) => tt.identifier === ts.id);
      if (!t) return;
      // a tap (no real drag) => hop
      if (!ts.moved || Math.abs(t.clientX - ts.startX) < 6) {
        if (gs.current.status === 'playing') doHop();
      }
      gs.current.moveDir = 0;
      touchState.current.id = null;
    };

    return (
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none select-none"
        style={{ imageRendering: 'pixelated' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        aria-label="Coin Dash arcade game"
      />
    );
  }
);

/* ============ procedural drawing helpers ============ */

function drawDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color?: string) {
  if (color) ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
    }
  }
}

type Painter = (x: number, y: number, c: string, w?: number, h?: number) => void;

function drawCloudG(gp: Painter, x: number, y: number, p: { cloud: string; cloudShadow: string }) {
  gp(x, y + 2, p.cloud, 14, 3);
  gp(x + 2, y + 1, p.cloud, 10, 4);
  gp(x + 4, y, p.cloud, 6, 5);
  gp(x, y + 4, p.cloudShadow, 14, 1);
}

function drawHillsG(gp: Painter, x: number, y: number, w: number, amp: number, color: string, freq: number, phase: number) {
  for (let px = 0; px < w; px++) {
    const hy = Math.round(y + Math.sin((px + phase * 30) * freq) * amp);
    gp(x + px, hy, color, 1, 40);
  }
}

function drawCoinG(gp: Painter, x: number, y: number, edge: boolean, p: { gold: string; goldLight: string; goldDark: string; ink: string }) {
  const cx = Math.round(x);
  const cy = Math.round(y);
  if (edge) {
    gp(cx, cy, p.ink, 1, 6);
    gp(cx + 1, cy, p.goldDark, 1, 6);
    gp(cx + 2, cy, p.ink, 1, 6);
  } else {
    gp(cx, cy, p.ink, 6, 6);
    gp(cx + 1, cy + 1, p.gold, 4, 4);
    gp(cx + 1, cy + 1, p.goldLight, 2, 2);
    gp(cx + 1, cy + 4, p.goldDark, 4, 1);
    gp(cx + 2, cy + 2, p.ink, 1, 1);
    gp(cx + 4, cy + 2, p.ink, 1, 1);
    gp(cx + 2, cy + 4, p.ink, 3, 1);
  }
}

function drawSpikeG(gp: Painter, x: number, y: number, p: { ink: string }) {
  // a little grey/ink pixel spike — hazard
  const cx = Math.round(x);
  const cy = Math.round(y);
  gp(cx, cy + 4, p.ink, 5, 2);      // base
  gp(cx + 1, cy + 2, p.ink, 3, 2);  // mid
  gp(cx + 2, cy, p.ink, 1, 2);      // tip
}

function drawSpriteGrid(gp: Painter, grid: string[], ox: number, oy: number, p: { ink: string; gold: string; goldLight: string; goldDark: string; cream: string }, flipX = false) {
  // map mascot palette chars to theme colors
  const map: Record<string, string> = {
    k: p.ink,
    O: p.goldLight,
    o: p.gold,
    d: p.goldDark,
    w: p.cream,
    e: '#ffffff',
    p: p.ink,
  };
  for (let yy = 0; yy < grid.length; yy++) {
    const row = grid[yy];
    for (let xx = 0; xx < row.length; xx++) {
      const ch = row[xx];
      if (ch === ' ' || ch === '.') continue;
      const col = map[ch] ?? p.gold;
      // mirror around the sprite's own center by reversing the X index,
      // so the sprite stays anchored at the same logical origin (ox, oy)
      // regardless of facing.
      const drawX = flipX ? ox + (row.length - 1 - xx) : ox + xx;
      gp(drawX, oy + yy, col, 1, 1);
    }
  }
}

// tiny pixel font for popups/overlay — only supports a small charset
const FONT: Record<string, string[]> = {
  '0': ['111','101','101','101','111'], '1': ['010','110','010','010','111'],
  '2': ['111','001','111','100','111'], '3': ['111','001','111','001','111'],
  '4': ['101','101','111','001','001'], '5': ['111','100','111','001','111'],
  '6': ['111','100','111','101','111'], '7': ['111','001','010','010','010'],
  '8': ['111','101','111','101','111'], '9': ['111','101','111','001','111'],
  ' ': ['00','00','00','00','00'],
  '+': ['0','1','1','1','0'], '·': ['0','0','1','0','0'],
  '!': ['1','1','1','0','1'], ':': ['0','1','0','1','0'],
  'A': ['010','101','111','101','101'], 'B': ['110','101','110','101','110'],
  'C': ['011','100','100','100','011'], 'D': ['110','101','101','101','110'],
  'E': ['111','100','110','100','111'], 'F': ['111','100','110','100','100'],
  'G': ['011','100','101','101','011'], 'H': ['101','101','111','101','101'],
  'I': ['111','010','010','010','111'], 'J': ['001','001','001','101','010'],
  'K': ['101','110','100','110','101'], 'L': ['100','100','100','100','111'],
  'M': ['101','111','111','101','101'], 'N': ['101','111','111','111','101'],
  'O': ['010','101','101','101','010'], 'P': ['110','101','110','100','100'],
  'R': ['110','101','110','101','101'], 'S': ['011','100','010','001','110'],
  'T': ['111','010','010','010','010'], 'U': ['101','101','101','101','010'],
  'V': ['101','101','101','101','010'], 'W': ['101','101','111','111','101'],
  'X': ['101','101','010','101','101'], 'Y': ['101','101','010','010','010'],
  'Z': ['111','001','010','100','111'],
};

function drawTextG(gp: Painter, x: number, y: number, text: string, color: string, _shadow: string) {
  let cx = Math.round(x);
  const upper = text.toUpperCase();
  for (const ch of upper) {
    const glyph = FONT[ch] ?? FONT[' '];
    const w = glyph[0].length;
    for (let yy = 0; yy < glyph.length; yy++) {
      for (let xx = 0; xx < glyph[yy].length; xx++) {
        if (glyph[yy][xx] === '1') gp(cx + xx, y + yy, color, 1, 1);
      }
    }
    cx += w + 1;
  }
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  wLog: number,
  hLog: number,
  gpx: number,
  p: { ink: string; gold: string; cream: string },
  title: string,
  subtitle: string,
  hint: string
) {
  // dim
  ctx.fillStyle = 'rgba(13,15,43,0.55)';
  ctx.fillRect(0, 0, wLog * gpx, hLog * gpx);
  const gp: Painter = (x, y, c, ww = 1, hh = 1) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x) * gpx, Math.round(y) * gpx, ww * gpx, hh * gpx);
  };
  const titleW = title.length * 6;
  drawTextG(gp, (wLog - titleW) / 2, hLog / 2 - 8, title, p.gold, p.ink);
  if (subtitle) {
    const subW = subtitle.length * 6;
    drawTextG(gp, (wLog - subW) / 2, hLog / 2 + 2, subtitle, p.cream, p.ink);
  }
  if (hint) {
    const hW = hint.length * 4;
    drawTextG(gp, (wLog - hW) / 2, hLog / 2 + 10, hint, p.cream, p.ink);
  }
}
