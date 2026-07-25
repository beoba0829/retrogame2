import { PixelSprite } from '@/components/sprites/PixelSprite';
import { COIN_FRONT, PALETTE } from '@/components/sprites/sprites';
import { useCopyState } from '@/hooks';
import { sound } from '@/utils/sound';

const CONTRACT = 'BUD5yD8mQK9pX2vN7rL4tZ3fW8hJ6cE1aF0sG7iU2oP';

export function Footer() {
  const { copied, copy } = useCopyState();

  return (
    <footer className="relative bg-night py-14">
      {/* grass strip on top */}
      <div className="absolute left-0 right-0 top-0 h-3 bg-grass" aria-hidden />

      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-6 text-center">
          <a href="#top" className="flex items-center gap-2" aria-label="$COINBUDDY home">
            <PixelSprite grid={COIN_FRONT} palette={PALETTE} pixel={2} scale={1.5} className="animate-bob" />
            <span className="font-pixel text-[0.8rem] text-gold">$COINBUDDY</span>
          </a>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sm font-medium text-cream/80 transition-colors hover:text-cyan"
            >
              Twitter
            </a>
            <span className="text-cream/30">·</span>
            <a
              href="https://telegram.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sm font-medium text-cream/80 transition-colors hover:text-purple-light"
            >
              Telegram
            </a>
            <span className="text-cream/30">·</span>
            <a
              href="https://dexscreener.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sm font-medium text-cream/80 transition-colors hover:text-gold"
            >
              DEX Chart
            </a>
          </div>

          <button
            onClick={() => {
              copy(CONTRACT);
              sound.copy();
            }}
            className="pixel-card px-4 py-2"
            aria-label="Copy contract address"
          >
            <span className="font-pixel text-[0.55rem] text-cream sm:text-[0.65rem]">
              {CONTRACT}
            </span>
            <span className={`ml-2 font-pixel text-[0.55rem] sm:text-[0.65rem] ${copied ? 'text-grass-light' : 'text-gold'}`}>
              {copied ? 'COPIED!' : 'COPY'}
            </span>
          </button>

          <p className="max-w-md font-body text-xs text-cream/50">
            $COINBUDDY is a meme coin with no intrinsic value. Not financial
            advice. Please touch grass. Pet the coin. Be kind.
          </p>

          <p className="font-pixel text-[0.5rem] text-cream/40">
            © {new Date().getFullYear()} THE MEADOW · MADE WITH PIXELS &amp; LOVE
          </p>
        </div>
      </div>
    </footer>
  );
}
