import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Dark Header */}
      <header className="bg-brand-dark px-4 py-4 flex items-center">
        <Image
          src="/images/LLC_Logo.svg"
          alt="Legacy Land & Cattle"
          width={140}
          height={60}
          className="h-10 w-auto object-contain"
        />
      </header>

      {/* Hero Section — full bleed background */}
      <section className="relative flex-1 flex flex-col items-center justify-center min-h-[85vh] text-center px-4 py-20">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero_pasture.jpg"
            alt="Cattle on pasture"
            fill
            priority
            className="object-cover"
            style={{ objectPosition: 'center 40%' }}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Centered Logo */}
          <div className="mb-8">
            <Image
              src="/images/LLC_Logo.svg"
              alt="Legacy Land & Cattle"
              width={200}
              height={90}
              className="h-20 w-auto object-contain mx-auto"
            />
          </div>

          <h1
            className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Legacy Land &amp; Cattle
          </h1>

          <div className="w-24 h-1 bg-brand-orange mx-auto mb-6 rounded-full" />

          <p className="text-lg md:text-xl text-gray-200 max-w-xl mx-auto mb-10">
            Reserve your share of premium, pasture-raised beef — raised right, butchered to your specs.
          </p>

          <Link
            href="/weight-explainer"
            className="inline-block bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold text-lg px-10 py-4 rounded-xl shadow-lg transition-colors duration-150 min-h-[56px]"
          >
            Reserve Your Beef →
          </Link>
        </div>
      </section>

      {/* Quick Info */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl mb-2">🌿</div>
            <h3 className="font-semibold text-brand-green mb-1">100% Grass-Fed</h3>
            <p className="text-sm text-brand-gray">Pasture-raised on open land, no feedlots ever.</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🥩</div>
            <h3 className="font-semibold text-brand-green mb-1">Custom Cut Sheets</h3>
            <p className="text-sm text-brand-gray">You decide exactly how your beef is butchered.</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🤝</div>
            <h3 className="font-semibold text-brand-green mb-1">Direct from Ranch</h3>
            <p className="text-sm text-brand-gray">Buy whole or half — straight from the source.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-brand-gray border-t border-brand-gray-light">
        <p>© {new Date().getFullYear()} Legacy Land & Cattle. All rights reserved.</p>
      </footer>
    </div>
  );
}
