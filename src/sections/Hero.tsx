import { useState } from 'react';
import { HeroCanvas } from '@/components/HeroCanvas';
import { Mascot } from '@/components/Mascot';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelSprite } from '@/components/sprites/PixelSprite';
import { COIN_FRONT, PALETTE } from '@/components/sprites/sprites';
import { useCopyState } from '@/hooks';
import { sound } from '@/utils/sound';

const CONTRACT = 'BUD5yD8mQK9pX2vN7rL4tZ3fW8hJ6cE1aF0sG7iU2oP';

export function Hero() {
  const { copied, copy } = useCopyState();
  const [buyHover, setBuyHover] = useState(false);

  return (
    <section id="top" className="relative min-h-screen w-full overflow-hidden">
      <HeroCanvas />

      {/* content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 pt-28 pb-16 text-center">
        {/* title */}
        <h1 className="font-pixel text-cream drop-shadow-[4px_4px_0_#1a1530]">
          <span className="block text-2xl leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
            <span className="text-gold animate-glow">$COIN</span>
            <span className="text-pink animate-glow" style={{ animationDelay: '0.8s' }}>BUDDY</span>
          </span>
        </h1>

        <p className="mt-5 max-w-xl font-body text-base text-cream/90 sm:text-lg md:text-xl">
          A tiny pixel coin with a big heart. Living in a little meadow
          you can poke, pet, and play with. Touch grass. Pet the coin.
          Number go up.
        </p>

        {/* mascot */}
        <div className="my-6 sm:my-8" data-mascot>
          <Mascot size={3.4} />
        </div>

        {/* BUY + socials */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="#buy"
            onMouseEnter={() => {
              setBuyHover(true);
              sound.tap();
              window.dispatchEvent(new Event('mascot:buyHover'));
            }}
            onMouseLeave={() => setBuyHover(false)}
          >
            <PixelButton variant="gold" className="px-6 py-3 text-sm sm:text-base">
              BUY $COINBUDDY
            </PixelButton>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <PixelButton variant="cyan">TWITTER</PixelButton>
          </a>
          <a href="https://telegram.org" target="_blank" rel="noopener noreferrer">
            <PixelButton variant="purple">TELEGRAM</PixelButton>
          </a>
        </div>

        {/* contract address */}
        <div className="mt-8 w-full max-w-xl">
          <p className="pixel-label mb-2">Contract Address</p>
          <button
            onClick={() => {
              copy(CONTRACT);
              sound.copy();
            }}
            className="pixel-card group flex w-full items-center justify-between gap-2 px-3 py-3 text-left sm:px-4"
            aria-label="Copy contract address"
          >
            <span className="truncate font-pixel text-[0.55rem] text-cream sm:text-[0.7rem]">
              {CONTRACT}
            </span>
            <span
              className={`flex shrink-0 items-center gap-1 font-pixel text-[0.55rem] sm:text-[0.65rem] ${
                copied ? 'text-grass-light' : 'text-gold'
              }`}
            >
              {copied ? 'COPIED!' : 'COPY'}
            </span>
          </button>
        </div>

        {/* scroll hint */}
        <div className="mt-10 flex flex-col items-center gap-1 text-cream/60">
          <span className="font-pixel text-[0.5rem]">SCROLL TO EXPLORE</span>
          <PixelSprite
            grid={['  k  ', '  k  ', '  k  ', ' kkk ', 'kkkkk', ' kkk ', '  k  ']}
            palette={PALETTE}
            pixel={3}
            className="animate-bob"
          />
        </div>
      </div>

      {/* decorative spinning coins in corners */}
      <div className="pointer-events-none absolute left-4 top-24 hidden sm:block">
        <PixelSprite grid={COIN_FRONT} palette={PALETTE} pixel={3} className="animate-bob coin-shimmer coin-sparkle" />
      </div>
      <div className="pointer-events-none absolute right-6 top-32 hidden sm:block">
        <PixelSprite grid={COIN_FRONT} palette={PALETTE} pixel={3} className="animate-floaty coin-shimmer coin-sparkle" style={{ ['--sparkle-delay' as string]: '2.4s' }} />
      </div>
    </section>
  );
}
