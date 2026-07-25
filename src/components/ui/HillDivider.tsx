import { useRaf } from '@/hooks';
import { useMemo } from 'react';
import { palette } from '@/utils/theme';

/**
 * A pixel hill divider that sits between sections.
 * Draws layered parallax hills + grass strip as inline SVG, animated gently.
 * Colors come from the live CSS-variable palette so the divider re-skins
 * automatically when the site switches between day and night.
 * `flip` renders it upside-down for top-of-section transitions.
 */
export function HillDivider({
  fromVar = '--c-hill-far',
  toVar = '--c-sky-mid',
  height = 90,
  flip = false,
  grassVar = '--c-grass-light',
  className = '',
}: {
  fromVar?: string;
  toVar?: string;
  height?: number;
  flip?: boolean;
  grassVar?: string;
  className?: string;
}) {
  const sway = useMemo(() => ({ v: 0, from: '#000', to: '#000', grass: '#000' }), []);

  // refresh colors from CSS vars every render so theme switches apply
  useRaf((_, t) => {
    sway.v = Math.sin(t / 1400) * 3;
    const p = palette();
    // map semantic var names to palette fields
    sway.from = colorForVar(fromVar, p);
    sway.to = colorForVar(toVar, p);
    sway.grass = colorForVar(grassVar, p);
  });

  const from = sway.from;
  const to = sway.to;
  const grassColor = sway.grass;

  const cols = 150;
  const step = 8;
  const baseY = height - 14;

  const hillPath: string[] = [];
  hillPath.push(`M0 ${height}`);
  for (let i = 0; i <= cols; i++) {
    const x = i * step;
    const y =
      baseY -
      Math.round(
        (Math.sin(i * 0.12) * 12 + Math.sin(i * 0.05 + 1) * 18) / step
      ) * step;
    hillPath.push(`L${x} ${y}`);
  }
  hillPath.push(`L${cols * step} ${height} Z`);

  const tufts: React.ReactElement[] = [];
  for (let i = 0; i < cols; i += 6) {
    const x = i * step;
    const y =
      baseY -
      Math.round(
        (Math.sin(i * 0.12) * 12 + Math.sin(i * 0.05 + 1) * 18) / step
      ) * step;
    tufts.push(
      <rect
        key={`t-${i}`}
        x={x}
        y={y - 6}
        width={step}
        height={6}
        fill={grassColor}
      />
    );
  }

  const gradId = `hill-${fromVar.slice(2)}-${toVar.slice(2)}`;

  return (
    <div
      className={`pointer-events-none w-full overflow-hidden ${className}`}
      style={{ height, transform: flip ? 'scaleY(-1)' : undefined }}
      aria-hidden
    >
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${cols * step} ${height}`}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        style={{ display: 'block', transform: `translateX(${sway.v}px)` }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <path d={hillPath.join(' ')} fill={`url(#${gradId})`} />
        {tufts}
      </svg>
    </div>
  );
}

function colorForVar(varName: string, p: ReturnType<typeof palette>): string {
  switch (varName) {
    case '--c-hill-far': return p.hillFar;
    case '--c-hill-near': return p.hillNear;
    case '--c-grass': return p.grass;
    case '--c-grass-light': return p.grassLight;
    case '--c-grass-dark': return p.grassDark;
    case '--c-sky-mid': return p.skyMid;
    case '--c-sky-top': return p.skyTop;
    case '--c-sky-bottom': return p.skyBottom;
    case '--c-mountain-near': return p.mountainNear;
    case '--c-mountain-far': return p.mountainFar;
    case '--c-forest':
    case '--c-hill-deep': return p.hillNear;
    default: return p.skyMid;
  }
}
