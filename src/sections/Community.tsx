import { Reveal } from '@/components/ui/Reveal';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelSprite } from '@/components/sprites/PixelSprite';
import { CAMPFIRE, MASCOT_BODY, PALETTE } from '@/components/sprites/sprites';
import { HillDivider } from '@/components/ui/HillDivider';

export function Community() {
  return (
    <section id="community" className="grain-overlay relative bg-gradient-to-b from-sky-300 to-sky-400 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <Reveal>
          <p className="pixel-label mb-3">// Community</p>
          <h2 className="font-pixel text-xl pixel-heading drop-shadow-[3px_3px_0_#1a1530] sm:text-2xl md:text-3xl">
            PULL UP A LOG
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-body text-cream/85">
            The meadow is always warm and there's always a spot by the fire.
            Come say gm. Bring snacks.
          </p>
        </Reveal>

        {/* campfire scene */}
        <Reveal delay={120} className="mt-10 flex justify-center">
          <div className="relative">
            <PixelSprite grid={CAMPFIRE} palette={PALETTE} pixel={5} scale={1.6} className="animate-fire" />
            <div className="absolute -left-16 bottom-2 sm:-left-24">
              <PixelSprite grid={MASCOT_BODY} palette={PALETTE} pixel={3} scale={2} className="animate-bob" />
            </div>
            {/* glow */}
            <div
              className="pointer-events-none absolute -inset-8 -z-10 rounded-[50%] opacity-50 blur-xl"
              style={{ background: 'radial-gradient(circle, #ff7a1a55, transparent 70%)' }}
            />
          </div>
        </Reveal>

        <Reveal delay={200} className="mt-10">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <PixelButton variant="cyan" className="px-5 py-3">TWITTER</PixelButton>
            </a>
            <a href="https://telegram.org" target="_blank" rel="noopener noreferrer">
              <PixelButton variant="purple" className="px-5 py-3">TELEGRAM</PixelButton>
            </a>
            <a href="https://dexscreener.com" target="_blank" rel="noopener noreferrer">
              <PixelButton variant="gold" className="px-5 py-3">DEX CHART</PixelButton>
            </a>
          </div>
        </Reveal>
      </div>

      <HillDivider fromVar="--c-sky-mid" toVar="--c-mountain-near" height={70} className="mt-12" />
    </section>
  );
}
