import { UiProvider } from '@/components/ui/UiProvider';
import { CRTOverlay } from '@/components/ui/CRTOverlay';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/sections/Hero';
import { CoinDash } from '@/sections/CoinDash';
import { About } from '@/sections/About';
import { Tokenomics } from '@/sections/Tokenomics';
import { HowToBuy } from '@/sections/HowToBuy';
import { Roadmap } from '@/sections/Roadmap';
import { Community } from '@/sections/Community';
import { FAQ } from '@/sections/FAQ';
import { Footer } from '@/sections/Footer';

function App() {
  return (
    <UiProvider>
      <CRTOverlay />
      <Navbar />
      <main className="relative">
        <Hero />
        <CoinDash />
        <About />
        <Tokenomics />
        <HowToBuy />
        <Roadmap />
        <Community />
        <FAQ />
      </main>
      <Footer />
    </UiProvider>
  );
}

export default App;
