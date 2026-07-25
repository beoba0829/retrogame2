import { Reveal } from '@/components/ui/Reveal';
import { PixelSprite } from '@/components/sprites/PixelSprite';
import { MASCOT_BODY, PALETTE, TREE, FLOWER_RED, FLOWER_RED_PAL, FLOWER_PURPLE, FLOWER_PURPLE_PAL } from '@/components/sprites/sprites';
import { HillDivider } from '@/components/ui/HillDivider';

export function About() {
  return (
    <section id="about" className="grain-overlay relative bg-gradient-to-b from-sky-400 to-sky-300 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
        {/* illustration */}
        <Reveal className="order-2 flex justify-center md:order-1">
          <div className="relative">
            <PixelSprite grid={TREE} palette={PALETTE} pixel={5} scale={2} className="animate-sway" />
            <div className="absolute -left-6 bottom-2">
              <PixelSprite grid={MASCOT_BODY} palette={PALETTE} pixel={3} scale={2.2} className="animate-bob" />
            </div>
            <div className="absolute right-0 bottom-0">
              <PixelSprite grid={FLOWER_RED} palette={FLOWER_RED_PAL} pixel={4} scale={2} className="animate-sway" />
            </div>
            <div className="absolute -right-4 bottom-6">
              <PixelSprite grid={FLOWER_PURPLE} palette={FLOWER_PURPLE_PAL} pixel={4} scale={1.6} className="animate-sway" />
            </div>
          </div>
        </Reveal>

        {/* text */}
        <Reveal delay={120} className="order-1 md:order-2">
          <p className="pixel-label mb-3">// About</p>
          <h2 className="font-pixel text-xl pixel-heading drop-shadow-[3px_3px_0_#1a1530] sm:text-2xl md:text-3xl">
            A COIN WITH FEELINGS
          </h2>
          <div className="mt-5 space-y-4 font-body text-base text-cream/90 sm:text-lg">
            <p>
              $COINBUDDY wasn't minted in a lab. It tumbled out of a pixel
              meadow one morning, blinked at the sun, and decided it loved
              everyone. It has no roadmap to the moon — it just wants you to
              touch grass and maybe pet it on the head.
            </p>
            <p>
              There's no team of suits, no tokenomics PhDs, and definitely no
              "utility." There's just a little coin that bounces when you click
              it and says <span className="font-pixel text-[0.7rem] text-gold">gm</span> when
              you hover. That's it. That's the whole project. We think that's
              enough.
            </p>
          </div>
        </Reveal>
      </div>

      <HillDivider fromVar="--c-sky-mid" toVar="--c-hill-near" height={70} className="mt-10" />
    </section>
  );
}
