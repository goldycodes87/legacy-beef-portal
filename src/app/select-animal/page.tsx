'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ReservationProgress from '@/components/ReservationProgress';

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
    <div className="min-h-screen bg-white">
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

      <ReservationProgress currentStep="choose" />

      {/* Content */}
      <main className="max-w-[640px] mx-auto px-4 py-10">
        <h1
          className="text-3xl md:text-4xl font-bold text-brand-dark mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          How was your beef raised?
        </h1>
        <p className="text-brand-gray mb-8 text-base">
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
                    onClick={() => setSelected(opt.id)}
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
            <button
              onClick={handleContinue}
              disabled={!selected}
              className={`
                w-full min-h-[48px] rounded-xl font-semibold text-base transition-colors duration-150
                ${selected
                  ? 'bg-brand-orange hover:bg-brand-orange-hover text-white cursor-pointer'
                  : 'bg-brand-gray-light text-brand-gray cursor-not-allowed'
                }
              `}
            >
              Continue →
            </button>
          </>
        )}
      </main>
    </div>
  );
}
