'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReservationProgress from '@/components/ReservationProgress';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import SiteFooter from '@/components/SiteFooter';

type AnimalType = 'grass_fed' | 'grain_finished' | 'wagyu' | 'no_preference';

interface CardOption {
  id: AnimalType;
  title: string;
  description: string;
  badge?: string;
  headerColor: string;
}

const BASE_OPTIONS: CardOption[] = [
  {
    id: 'grass_fed',
    title: 'Grass-Fed Beef',
    description: 'Raised on pasture. Rich, complex flavor. Leaner.',
    badge: 'Signature',
    headerColor: 'bg-brand-green',
  },
  {
    id: 'grain_finished',
    title: 'Grain-Finished Beef',
    description: 'Finished on grain for marbling and tenderness.',
    badge: 'Classic',
    headerColor: 'bg-amber-700',
  },
  {
    id: 'wagyu',
    title: 'American Wagyu',
    description: 'Japanese Wagyu × Black Angus. Extraordinary marbling.',
    badge: 'Premium',
    headerColor: 'bg-purple-900',
  },
  {
    id: 'no_preference',
    title: 'No Preference',
    description: 'See all animals and butcher dates available and pick the one that works best for you.',
    headerColor: 'bg-brand-dark',
  },
];

export default function SelectAnimalPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<AnimalType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWagyuModal, setShowWagyuModal] = useState(false);
  const [wagyuAcknowledged, setWagyuAcknowledged] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  // Only wagyu visibility is conditional — all other cards always show
  const [wagyuActive, setWagyuActive] = useState(false);
  const [wagyuNotifyOpen, setWagyuNotifyOpen] = useState(false);
  const [wagyuForm, setWagyuForm] = useState({ name: '', email: '', size: 'half' });
  const [wagyuSubmitting, setWagyuSubmitting] = useState(false);
  const [wagyuSubmitted, setWagyuSubmitted] = useState(false);

  const handleWagyuNotify = async () => {
    if (!wagyuForm.name || !wagyuForm.email) return;
    setWagyuSubmitting(true);
    const res = await fetch('/api/wagyu-waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: wagyuForm.name,
        email: wagyuForm.email,
        size_preference: wagyuForm.size,
      }),
    });
    if (res.ok) setWagyuSubmitted(true);
    setWagyuSubmitting(false);
  };

  useEffect(() => {
    // Landing here without a size means the funnel was skipped — the nav used
    // to link straight to this page. Defaulting to 'half' silently booked a
    // size the customer never chose, so send them back to step one instead.
    const selectedSize = sessionStorage.getItem('selectedSize');
    if (!selectedSize) {
      router.replace('/weight-explainer');
      return;
    }

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

  // Wagyu is always visible with notify-me fallback when unavailable
  const visibleOptions = BASE_OPTIONS.filter(() => true);

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
        <p className="font-body text-brand-gray mb-2 text-base">
          Your choice determines which animals and dates are available.
        </p>
        <button
          onClick={() => setShowDiffModal(true)}
          className="text-brand-orange text-sm font-semibold underline underline-offset-2 hover:text-brand-orange-hover mb-8"
        >
          What&apos;s the difference?
        </button>

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
                
                // Wagyu "Coming Soon" card when unavailable
                if (opt.id === 'wagyu' && !wagyuActive) {
                  return (
                    <div
                      key={opt.id}
                      className="rounded-2xl overflow-hidden shadow-sm cursor-pointer transition-all duration-200 border-2 border-transparent hover:border-brand-orange/40 hover:shadow-md"
                    >
                      {/* Purple header */}
                      <div className="p-4 relative bg-purple-900">
                        <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white mb-2">
                          Premium
                        </span>
                        <h3 className="font-display font-bold text-lg text-white">
                          American Wagyu
                        </h3>
                      </div>
                      {/* White body with notify form */}
                      <div className="bg-white p-4 flex flex-col justify-between" style={{minHeight: "160px"}}>
                        <p className="font-body text-brand-gray text-sm leading-relaxed mb-4">
                          50% Japanese Wagyu × Black Angus. Extraordinary marbling, buttery flavor, limited availability.
                        </p>
                        {!wagyuSubmitted ? (
                          <>
                            {!wagyuNotifyOpen ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); setWagyuNotifyOpen(true); }}
                                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-body font-semibold text-sm transition-colors"
                              >
                                Notify Me When Available →
                              </button>
                            ) : (
                              <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  placeholder="Your name"
                                  value={wagyuForm.name}
                                  onChange={(e) => setWagyuForm({ ...wagyuForm, name: e.target.value })}
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <input
                                  type="email"
                                  placeholder="Your email"
                                  value={wagyuForm.email}
                                  onChange={(e) => setWagyuForm({ ...wagyuForm, email: e.target.value })}
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <select
                                  value={wagyuForm.size}
                                  onChange={(e) => setWagyuForm({ ...wagyuForm, size: e.target.value })}
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                  <option value="whole">Whole Beef</option>
                                  <option value="half">Half Beef</option>
                                  <option value="quarter">Quarter Beef</option>
                                </select>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleWagyuNotify(); }}
                                  disabled={wagyuSubmitting || !wagyuForm.name || !wagyuForm.email}
                                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-body font-semibold text-sm transition-colors"
                                >
                                  {wagyuSubmitting ? 'Saving...' : 'Notify Me →'}
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="font-body font-semibold text-purple-600 text-sm text-center">
                            ✓ You're on the list!
                          </p>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowWagyuModal(true); }}
                          className="w-full mt-2 py-2 rounded-xl border border-purple-300 text-purple-700 font-body text-sm hover:bg-purple-50 transition-colors"
                        >
                          More About Our Wagyu →
                        </button>
                      </div>
                    </div>
                  );
                }

                // Active wagyu card
                if (opt.id === 'wagyu' && wagyuActive) {
                  return (
                    <div
                      key={opt.id}
                      onClick={() => { setSelected(opt.id); setShowWagyuModal(true); }}
                      className={`rounded-2xl overflow-hidden shadow-sm cursor-pointer transition-all duration-200 border-2
                      ${isSelected
                        ? 'border-brand-orange scale-[1.02] shadow-lg'
                        : 'border-transparent hover:border-brand-orange/40 hover:shadow-md'}`}
                    >
                      {/* Purple header */}
                      <div className={`p-4 relative ${opt.headerColor}`}>
                        {opt.badge && (
                          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white mb-2">
                            {opt.badge}
                          </span>
                        )}
                        <h3 className="font-display font-bold text-lg text-white">
                          {opt.title}
                        </h3>
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-orange flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {/* White body */}
                      <div className="bg-white p-4 rounded-b-2xl flex-1" style={{minHeight: '160px'}}>
                        <p className="font-body text-brand-gray text-sm leading-relaxed">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Regular card (grass_fed, grain_finished, no_preference)
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelected(opt.id)}
                    className={`rounded-2xl overflow-hidden shadow-sm cursor-pointer transition-all duration-200 border-2 flex flex-col
                    ${isSelected
                      ? 'border-brand-orange scale-[1.02] shadow-lg'
                      : 'border-transparent hover:border-brand-orange/40 hover:shadow-md'}`}
                  >
                    {/* Colored header */}
                    <div className={`p-4 relative ${opt.headerColor}`}>
                      {opt.badge && (
                        <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white mb-2">
                          {opt.badge}
                        </span>
                      )}
                      <h3 className="font-display font-bold text-lg text-white">
                        {opt.title}
                      </h3>
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-orange flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* White body */}
                    <div className="bg-white p-4 rounded-b-2xl flex-1" style={{minHeight: '160px'}}>
                      <p className="font-body text-brand-gray text-sm leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </div>
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
            {wagyuActive && (
              <label className="flex items-start gap-3 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wagyuAcknowledged}
                  onChange={(e) => setWagyuAcknowledged(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-brand-orange flex-shrink-0"
                />
                <span className="font-body text-brand-dark text-sm leading-relaxed">
                  I understand that Wagyu beef is priced at <strong>$9.50–$10.00/lb hanging weight</strong> — higher than standard beef due to the breed and care required.
                </span>
              </label>
            )}
            <button
              onClick={() => { setShowWagyuModal(false); setWagyuAcknowledged(false); }}
              disabled={wagyuActive && !wagyuAcknowledged}
              className="w-full bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors"
            >
              Got It — Continue
            </button>
          </div>
        </div>
      )}

      {showDiffModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <h3 className="font-display font-bold text-2xl text-brand-dark mb-4 text-center">Grass-Fed vs. Grain-Finished</h3>

            <div className="mb-5">
              <p className="font-display font-bold text-lg text-brand-dark mb-2">
                🌿 Grass-Fed & Grass-Finished
              </p>
              <p className="font-body text-brand-gray text-sm leading-relaxed">
                Our grass-fed cattle spend their entire lives on pasture, eating what nature intended. The result is leaner beef with a slightly more complex, earthy flavor. Rich in omega-3s and CLA. Ideal if you prefer a traditional, old-school beef flavor that&apos;s lighter on the palate.
              </p>
            </div>

            <div className="mb-5">
              <p className="font-display font-bold text-lg text-brand-dark mb-2">
                🌾 Grain-Finished
              </p>
              <p className="font-body text-brand-gray text-sm leading-relaxed">
                Our grain-finished cattle are pasture-raised and then finished on a grain diet for the final months. This produces more marbling and a richer, buttery flavor that most people are familiar with from quality steakhouses. Tender, juicy, and crowd-pleasing.
              </p>
            </div>

            <div className="mb-6 bg-brand-warm rounded-xl p-4">
              <p className="font-display font-bold text-base text-brand-dark mb-1">
                ✨ American Wagyu
              </p>
              <p className="font-body text-brand-gray text-sm leading-relaxed">
                A cross between Japanese Wagyu and Black Angus — extraordinary marbling, rich buttery flavor, and exceptional tenderness. Available by reservation only. Premium priced at $9.50–$10.00/lb.
              </p>
            </div>

            <p className="font-body text-brand-gray text-xs text-center mb-4">
              Not sure? Both grass-fed and grain-finished are priced the same. Pick what sounds best to you — you can&apos;t go wrong.
            </p>

            <button
              onClick={() => setShowDiffModal(false)}
              className="w-full py-3 bg-brand-orange text-white rounded-xl font-body font-semibold hover:bg-brand-orange-hover transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
