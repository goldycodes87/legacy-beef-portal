import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Grass-Fed Beef Direct From Our Ranch | Legacy Land & Cattle',
  description: 'Reserve your share of the harvest. Whole, half, or quarter beef — customized exactly how you want it.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brand-warm">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image
          src="/images/hero_pasture.jpg"
          alt="Black Forest Cattle Ranch"
          fill
          className="absolute inset-0 object-cover object-[center_40%]"
          priority
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 max-w-content text-center px-4">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/images/LLC_Logo.svg"
              alt="Legacy Land & Cattle"
              width={200}
              height={90}
              className="h-16 w-auto mb-6"
            />
          </div>

          {/* Headline */}
          <h1
            className="font-display font-black text-white mb-4"
            style={{ fontSize: 'clamp(2.25rem, 10vw, 3.25rem)' }}
          >
            Grass-Fed Beef, Direct From Our Ranch
          </h1>

          {/* Subheadline */}
          <p className="font-body text-white/80 text-lg mb-8 max-w-lg mx-auto">
            Reserve your share of the harvest. Whole, half, or quarter beef — customized exactly how you want it.
          </p>

          {/* CTA Button */}
          <Link href="/weight-explainer">
            <Button size="lg" fullWidth className="mb-6 max-w-xs mx-auto">
              Reserve Your Beef →
            </Button>
          </Link>

          {/* Small Text */}
          <p className="font-body text-white/60 text-sm">
            2026 slots are filling fast. Grass-fed & grain-finished available.
          </p>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-wide mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Value Prop 1 */}
            <div className="text-center">
              <div className="text-4xl mb-4">🐄</div>
              <h3 className="font-display font-bold text-xl text-brand-dark mb-2">Ranch Direct</h3>
              <p className="font-body text-brand-gray">
                No middleman. Straight from our Black Forest, CO ranch to your freezer.
              </p>
            </div>

            {/* Value Prop 2 */}
            <div className="text-center">
              <div className="text-4xl mb-4">✂️</div>
              <h3 className="font-display font-bold text-xl text-brand-dark mb-2">Custom Cut</h3>
              <p className="font-body text-brand-gray">
                You choose every cut — steaks, roasts, ground beef — exactly how your family likes it.
              </p>
            </div>

            {/* Value Prop 3 */}
            <div className="text-center">
              <div className="text-4xl mb-4">❄️</div>
              <h3 className="font-display font-bold text-xl text-brand-dark mb-2">Bulk Value</h3>
              <p className="font-body text-brand-gray">
                Whole, half, or quarter beef at $8.00–$8.50/lb hanging weight. Fill your freezer for months.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-brand-warm py-16 px-4">
        <div className="max-w-wide mx-auto">
          <h2
            className="font-display font-bold text-3xl text-brand-dark text-center mb-12"
          >
            How It Works
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'Reserve Your Spot', desc: 'Pay deposit' },
              { num: '2', title: 'Build Your Cut Sheet', desc: 'Customize your cuts' },
              { num: '3', title: 'Send to Butcher', desc: 'We handle everything' },
              { num: '4', title: 'Pick Up Your Beef', desc: 'At the ranch' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div
                  className="w-12 h-12 rounded-full bg-brand-orange text-white font-body font-bold flex items-center justify-center mx-auto mb-4"
                >
                  {step.num}
                </div>
                <h3 className="font-display font-bold text-lg text-brand-dark mb-1">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-brand-gray">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
