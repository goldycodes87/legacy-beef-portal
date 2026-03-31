'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReservationProgress from '@/components/ReservationProgress';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';

type AnimalType = 'grass_fed' | 'grain_finished' | 'wagyu' | 'no_preference';

interface CardOption {
  id: AnimalType;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
}

const BASE_OPTIONS: CardOption[] = [
  {
    id: 'grass_fed',
    title: 'Grass-Fed & Grass-Finished',
    description: 'Pasture-raised on open land from birth to harvest. No grain, no feedlots.',
    badge: 'Most Popular',
    badgeColor: 'bg-brand-green text-white',
  },
  {
    id: 'grain_finished',
    title: 'Grain-Finished',
    description: 'Grass-raised with a grain-finishing period for enhanced marbling.',
  },
  {
    id: 'wagyu',
    title: 'American Wagyu',
    description: 'Ultra-premium marbling with rich, buttery flavor. Limited availability.',
    badge: 'Premium',
    badgeColor: 'bg-brand-orange text-white',
  },
  {
    id: 'no_preference',
    title: 'No Preference',
    description: 'Show me all available dates and animals.',
  },
];

export default function SelectAnimalPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<AnimalType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWagyuModal, setShowWagyuModal] = useState(false);
  // Only wagyu visibility is conditional — all other cards always show
  const [wagyuActive, setWagyuActive] = useState(false);

  useEffect(() => {
    const selectedSize = sessionStorage.getItem('selectedSize') || 'half';

    async function checkWagyu() {
      try {
        const res = await fetch(`/api/slots?animalType=wagyu&purchaseType=${selectedSize}`);
        const data = await res.json();
        // Show wagyu card if any wagyu animals are returned
        setWagyuActive((data.slots || []).length > 0);
      } catch {
        // On error, hide wagyu (safer to not show if uncertain)
        setWagyuActive(false);
      } finally {
        setLoading(false);
      }
    }

    checkWagyu();
  }, []);

  // Always show grass_fed, grain_finished, no_preference.
  // Only wagyu is conditional based on wagyu_active animals in DB.
  const visibleOptions = BASE_OPTIONS.filter(
    (opt) => opt.id !== 'wagyu' || wagyuActive
  );

  function handleContinue() {
    if (!selected) return;
    sessionStorage.setItem('animalTypePreference', selected);
    router.push('/book');
  }

  return (
    <div className="min-h-screen bg-brand-warm">
      <PageHeader showBack={true} currentStep={3} totalSteps={6} />

      <ReservationProgress currentStep="choose" />

      {/* Content */}
      <main className="max-w-[640px] mx-auto px-4 py-10">
        <h1 className="font-display font-bold text-3xl md:text-4xl text-brand-dark mb-3">
          How was your beef raised?
        </h1>
        <p className="font-body text-brand-gray mb-8 text-base">
          Your choice determines which animals and dates are available.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {visibleOptions.map((opt) => {
                const isSelected = selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setSelected(opt.id); if (opt.id === 'wagyu') setShowWagyuModal(true); }}
                    className={`
                      relative text-left rounded-xl border-2 p-5 transition-all duration-150
                      focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2
                      ${isSelected
                        ? 'border-brand-orange bg-[#FFF5F0]'
                        : 'border-brand-gray-light bg-white hover:border-brand-orange hover:scale-[1.02]'
                      }
                    `}
                  >
                    {opt.badge && (
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${opt.badgeColor}`}>
                        {opt.badge}
                      </span>
                    )}
                    <h3 className="font-semibold text-brand-dark text-base mb-1">
                      {opt.title}
                    </h3>
                    <p className="text-sm text-brand-gray leading-relaxed">
                      {opt.description}
                    </p>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-orange flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Continue button */}
            <Button
              onClick={handleContinue}
              disabled={!selected}
              fullWidth
              size="lg"
            >
              Continue →
            </Button>
          </>
        )}
      </main>

      {showWagyuModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
            <div className="text-4xl mb-4 text-center">⭐</div>
            <h3 className="font-display font-bold text-2xl text-brand-dark mb-3 text-center">American Wagyu</h3>
            <p className="text-brand-gray text-sm leading-relaxed mb-4">
              Our American Wagyu is a cross between Japanese Wagyu and Black Angus cattle — 50% of each. The result is beef with extraordinary marbling, rich buttery flavor, and a tenderness you won&apos;t find in conventional beef.
            </p>
            <p className="text-brand-gray text-sm leading-relaxed mb-4">
              Unlike pure Japanese Wagyu, American Wagyu has a heartier, beefier flavor profile that American palates love — you get the best of both worlds. The marbling melts during cooking, basting the meat from within for an incredibly juicy, flavorful result.
            </p>
            <p className="text-brand-gray text-sm leading-relaxed mb-6">
              Wagyu cattle require significantly more feed, more time, and more hands-on care than conventional beef cattle — which is why the price reflects that. But for beef lovers who want something truly exceptional, there&apos;s nothing quite like it.
            </p>
            <div className="bg-brand-warm rounded-xl p-4 mb-6 text-sm text-brand-dark">
              <p className="font-semibold mb-1">Wagyu Pricing</p>
              <p>Whole: $9.50/lb · Half: $9.75/lb · Quarter: $10.00/lb hanging weight</p>
            </div>
            <button
              onClick={() => setShowWagyuModal(false)}
              className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3 rounded-xl font-semibold"
            >
              Got It — Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
