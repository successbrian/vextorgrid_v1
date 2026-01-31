import { Truck, Package, CircleDollarSign } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { Footer } from './Footer';

interface LandingPageProps {
  onGetStarted: (mode: 'login' | 'signup') => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <nav className="border-b border-[#333] bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            <div className="flex items-center gap-3">
              <img
                src="/vextorgrid_logo_1a1a1a_background_12_25_2025.png"
                alt="VextorGrid.com"
                className="h-20"
              />
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => onGetStarted('signup')} variant="secondary">
                GET STARTED NOW
              </Button>
              <Button onClick={() => onGetStarted('login')} variant="ghost">
                Login
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6" style={{ fontFamily: 'monospace' }}>
            VextorGrid.com
          </h1>
          <p className="text-2xl sm:text-3xl lg:text-4xl text-[#E5E4E2] mb-12 tracking-wide">
            YOUR LIFE. ON THE GRID.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#FF4500] flex items-center justify-center mb-4">
                  <Truck size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#008080]" style={{ fontFamily: 'monospace' }}>
                  LOGISTICS
                </h3>
                <p className="text-gray-400">
                  Optimize your routes and fuel. Track mileage, schedule maintenance, and maximize efficiency on every haul.
                </p>
              </div>
            </Card>

            <Card>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#FF4500] flex items-center justify-center mb-4">
                  <Package size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#008080]" style={{ fontFamily: 'monospace' }}>
                  RATIONS
                </h3>
                <p className="text-gray-400">
                  Manage inventory and nutrition. Keep track of supplies, plan meals, and maintain peak operational readiness.
                </p>
              </div>
            </Card>

            <Card>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#FF4500] flex items-center justify-center mb-4">
                  <CircleDollarSign size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#008080]" style={{ fontFamily: 'monospace' }}>
                  ASSETS
                </h3>
                <p className="text-gray-400">
                  Track wealth and hard assets. Monitor income, expenses, and build your financial command center.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-16 border-t border-[#333]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'monospace' }}>
            BUILT FOR OPERATORS
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Whether you're a long-haul trucker, gig driver, or high-performance operator,
            Vextor Grid is your mission control center for life on the move.
          </p>
          <Button onClick={() => onGetStarted('signup')} variant="secondary" className="text-lg">
            GET STARTED NOW
          </Button>
        </div>
      </section>

      <div className="border-t border-[#333] bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <Footer variant="public" />
        </div>
      </div>
    </div>
  );
}
