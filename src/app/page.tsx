import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        {/* Logo / Brand Mark */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-brand-green flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-12 h-12 text-white fill-current" aria-hidden="true">
              {/* Simple longhorn silhouette */}
              <ellipse cx="50" cy="60" rx="22" ry="18" />
              <ellipse cx="50" cy="44" rx="12" ry="10" />
              {/* Horns */}
              <path d="M38 40 Q20 30 18 20 Q22 18 26 24 Q30 32 38 38Z" />
              <path d="M62 40 Q80 30 82 20 Q78 18 74 24 Q70 32 62 38Z" />
              {/* Ears */}
              <ellipse cx="36" cy="46" rx="5" ry="3" transform="rotate(-20 36 46)" />
              <ellipse cx="64" cy="46" rx="5" ry="3" transform="rotate(20 64 46)" />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-green mb-2">
          Legacy Land & Cattle
        </h1>
        <div className="w-24 h-1 bg-brand-tan mx-auto mb-6 rounded-full" />

        <p className="text-lg md:text-xl text-gray-700 max-w-2xl mb-10">
          Reserve your share of premium, pasture-raised beef — raised right, butchered to your specs.
        </p>

        <Link href="/book" className="btn-primary text-lg px-8 py-4 shadow-lg">
          Reserve Your Beef →
        </Link>

        {/* Quick Info */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl w-full">
          <div className="text-center">
            <div className="text-3xl mb-2">🌿</div>
            <h3 className="font-semibold text-brand-green mb-1">100% Grass-Fed</h3>
            <p className="text-sm text-gray-600">Pasture-raised on open land, no feedlots ever.</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🥩</div>
            <h3 className="font-semibold text-brand-green mb-1">Custom Cut Sheets</h3>
            <p className="text-sm text-gray-600">You decide exactly how your beef is butchered.</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🤝</div>
            <h3 className="font-semibold text-brand-green mb-1">Direct from Ranch</h3>
            <p className="text-sm text-gray-600">Buy whole or half — straight from the source.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500 border-t border-gray-200">
        <p>© {new Date().getFullYear()} Legacy Land & Cattle. All rights reserved.</p>
      </footer>
    </main>
  );
}
