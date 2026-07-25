import { useState, useCallback, useRef } from 'react';
import { PixelSprite } from '@/components/sprites/PixelSprite';
import { COIN_FRONT, COIN_SIDE, PALETTE } from '@/components/sprites/sprites';
import { sound } from '@/utils/sound';
import { useRaf } from '@/hooks';

interface CollectPop {
  id: number;
  x: number;
  y: number;
}

let popId = 0;

/**
 * A spinning pixel coin. Spins continuously; spins faster on hover.
 * Click to "collect" — plays a sound and pops a "+1" that floats up.
 */
export function SpinningCoin({
  size = 1,
  className = '',
  fastHover = true,
}: {
  size?: number;
  className?: string;
  fastHover?: boolean;
}) {
  const [hovering, setHovering] = useState(false);
  const [pops, setPops] = useState<CollectPop[]>([]);
  const phase = useRef(0);
  const [showFront, setShowFront] = useState(true);

  useRaf((dt) => {
    const speed = hovering && fastHover ? 0.012 : 0.0035;
    phase.current += dt * speed;
    // 8-frame spin cycle; show side near the "edge" frames
    const frame = Math.floor((phase.current % 8));
    setShowFront(frame !== 2 && frame !== 6);
  });

  const collect = useCallback((e: React.MouseEvent) => {
    sound.coin();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id = ++popId;
    setPops((p) => [
      ...p,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
    setTimeout(() => setPops((p) => p.filter((pop) => pop.id !== id)), 900);
  }, []);

  return (
    <button
      type="button"
      className={`relative cursor-pointer outline-none ${className}`}
      style={{ background: 'none', border: 'none', padding: 0 }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={collect}
      aria-label="Collect a coin"
    >
      <PixelSprite
        grid={showFront ? COIN_FRONT : COIN_SIDE}
        palette={PALETTE}
        pixel={4}
        scale={size}
        style={{ transition: 'transform 0.1s ease' }}
      />
      {pops.map((pop) => (
        <span
          key={pop.id}
          className="pointer-events-none absolute font-pixel text-gold"
          style={{
            left: pop.x,
            top: pop.y,
            fontSize: '0.7rem',
            color: '#ffd23f',
            textShadow: '2px 2px 0 #1a1530',
            animation: 'rise 0.9s ease-out forwards',
            transform: 'translate(-50%, -50%)',
          }}
        >
          +1
        </span>
      ))}
    </button>
  );
}
