import { Reveal } from '@/components/ui/Reveal';
import { PixelSprite } from '@/components/sprites/PixelSprite';
import { ICON_WALLET, ICON_SOL, ICON_CONNECT, ICON_SWAP, ARROW_DOWN, PALETTE } from '@/components/sprites/sprites';
import { HillDivider } from '@/components/ui/HillDivider';

const STEPS = [
  {
    n: '01',
    title: 'Install Phantom',
    body: 'Grab the Phantom wallet extension for your browser or the app for your phone. Make a wallet, save your seed phrase somewhere safe.',
    icon: ICON_WALLET,
  },
  {
    n: '02',
    title: 'Get Some SOL',
    body: 'Buy SOL on an exchange you trust, then send it to your Phantom wallet address. You need SOL to swap for buddies.',
    icon: ICON_SOL,
  },
  {
    n: '03',
    title: 'Connect Wallet',
    body: 'Head to a swap like Jupiter or Raydium, connect your Phantom wallet, and get ready to make the trade.',
    icon: ICON_CONNECT,
  },
  {
    n: '04',
    title: 'Swap For Buddies',
    body: 'Paste the $COINBUDDY contract address, set the amount of SOL you want to spend, and hit swap. Welcome to the meadow.',
    icon: ICON_SWAP,
  },
];

export function HowToBuy() {
  return (
    <section id="buy" className="grain-overlay relative bg-gradient-to-b from-sky-300 to-sky-200 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="text-center">
          <p className="pixel-label mb-3">// How To Buy</p>
          <h2 className="font-pixel text-xl pixel-heading drop-shadow-[3px_3px_0_#1a1530] sm:text-2xl md:text-3xl">
            JOIN THE MEADOW
          </h2>
          <p className="mx-auto mt-4 max-w-md font-body text-cream/80">
            Four steps. Even the coin could do it, and it doesn't have hands.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 100} className="relative">
              <div className="pixel-card flex h-full flex-col items-center gap-3 p-5 text-center">
                <div className="flex items-center gap-3">
                  <PixelSprite grid={s.icon} palette={PALETTE} pixel={3} />
                  <span className="font-pixel text-2xl text-gold drop-shadow-[2px_2px_0_#1a1530]">
                    {s.n}
                  </span>
                </div>
                <h3 className="font-pixel text-[0.8rem] text-cream">{s.title}</h3>
                <p className="font-body text-sm text-cream/80">{s.body}</p>
              </div>
              {/* connecting arrow */}
              {i < STEPS.length - 1 && (
                <div className="absolute -bottom-7 left-1/2 hidden -translate-x-1/2 lg:block">
                  <PixelSprite grid={ARROW_DOWN} palette={PALETTE} pixel={3} className="animate-bob" />
                </div>
              )}
              {/* mobile vertical arrow */}
              {i < STEPS.length - 1 && (
                <div className="flex justify-center py-3 lg:hidden">
                  <PixelSprite grid={ARROW_DOWN} palette={PALETTE} pixel={2} />
                </div>
              )}
            </Reveal>
          ))}
        </div>
      </div>

      <HillDivider fromVar="--c-sky-mid" toVar="--c-grass" height={70} grassVar="--c-grass-light" className="mt-10" />
    </section>
  );
}
