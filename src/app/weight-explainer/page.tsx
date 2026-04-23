'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import WeightExplainer from '@/components/WeightExplainer';
import ReservationProgress from '@/components/ReservationProgress';
import BeefCalculator from '@/components/BeefCalculator';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Timeline } from '@/components/ui/modern-timeline';

export default function WeightExplainerPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [step, setStep] = useState<'idle'|'intro'|'form'|'ready'>('idle');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Prices
  const [prices, setPrices] = useState({
    whole: 8.00,
    half: 8.25,
    quarter: 8.50,
  });

  // Fetch prices on mount
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        setPrices({
          whole: parseFloat(data.price_whole || '8.00'),
          half: parseFloat(data.price_half || '8.25'),
          quarter: parseFloat(data.price_quarter || '8.50'),
        });
      })
      .catch(() => {}); // keep defaults on error
  }, []);

  function validateEmail(e: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  function handleContinue() {
    if (!checked) return;
    sessionStorage.setItem('customerFirstName', firstName);
    sessionStorage.setItem('customerLastName', lastName);
    sessionStorage.setItem('customerEmail', email);
    sessionStorage.setItem('weightExplainerComplete', 'true');
    router.push('/select-size');
  }

  return (
    <div className="min-h-screen bg-brand-warm">
      <PageHeader showBack={true} currentStep={1} totalSteps={6} />

      <ReservationProgress currentStep="learn" />

      <main className="max-w-[700px] mx-auto px-4 py-10">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: Know Before You Buy */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="mb-10 text-center">
          <h1 className="font-display font-bold text-3xl md:text-4xl text-brand-dark mb-4">
            Know Your Beef Before You Buy
          </h1>
          <p className="font-body text-brand-gray text-base leading-relaxed max-w-[560px] mx-auto">
            One of the most common surprises for first-time bulk beef buyers is yield. Here&apos;s exactly what to expect.
          </p>
        </section>

        {/* Things to Know Card */}
        <div className="bg-brand-dark rounded-2xl p-6 mb-8">
          <h3 className="font-display font-bold text-lg text-white mb-4">
            📋 Things to Know Before You Buy
          </h3>
          <div className="space-y-3">
            {[
              {
                icon: '⚖️',
                title: 'Price is charged on hanging weight',
                desc: 'Not live weight, not finished cuts. Hanging weight is what remains after the animal is harvested and cleaned.',
              },
              {
                icon: '💰',
                title: 'Pricing varies by purchase size',
                desc: `Whole beef: $${prices.whole.toFixed(2)}/lb · Half beef: $${prices.half.toFixed(2)}/lb · Quarter beef: $${prices.quarter.toFixed(2)}/lb. The more you buy, the better the price.`,
              },
              {
                icon: '🚛',
                title: 'Transportation & processing included',
                desc: 'Your price covers everything — raising, transport to the butcher, processing, vacuum sealing, and labeling. No hidden fees.',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 pb-3 border-b border-white/10 last:border-0 last:pb-0">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="font-body font-semibold text-white text-sm">{item.title}</p>
                  <p className="font-body text-white/60 text-sm mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Helper Text */}
        <p className="font-body text-brand-gray text-sm text-center mb-4">
          👇 Adjust the slider below to estimate your cost based on animal size.
        </p>

        {/* Weight Explainer */}
        <section className="mb-16">
          <div className="overflow-x-auto max-w-full">
            <WeightExplainer />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: Tools */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="mt-16 mb-8 text-center">
          <h2 className="font-display font-bold text-2xl text-brand-dark mb-2">
            Find Your Size
          </h2>
          <p className="font-body text-brand-gray text-sm">
            Use these tools to figure out what's right for your household.
          </p>
        </div>

        <div className="space-y-10 mb-16">
          {/* Beef Calculator */}
          <BeefCalculator />

          {/* Freezer Video */}
          <div>
            <h3 className="font-display font-bold text-xl text-brand-dark mb-2 text-center">
              Will It Fit In My Freezer?
            </h3>
            <p className="font-body text-brand-gray text-sm mb-4 text-center">
              Watch this quick video to see exactly how much freezer space you'll need.
            </p>
            <video
              controls
              preload="metadata"
              poster="/images/hero_pasture.jpg"
              className="w-full max-w-[750px] mx-auto block"
              style={{ borderRadius: '12px' }}
            >
              <source src="/videos/Freezervideo.mp4" type="video/mp4" />
              Your browser does not support video playback.
            </video>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: Beef Journey Timeline */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="mb-12">
          <h2 className="font-display font-bold text-2xl text-brand-dark text-center mb-2">
            Your Beef Journey
          </h2>
          <p className="font-body text-brand-gray text-center text-sm mb-6">
            From our ranch to your freezer — here's exactly what happens.
          </p>
          <Timeline items={[
            {
              icon: '🐄',
              title: 'Reserve Your Spot',
              date: 'Day 1',
              description: 'Pay your deposit to lock in your slot. Choose your size — whole, half, or quarter. Your price per pound is set at this point.',
            },
            {
              icon: '✂️',
              title: 'Fill Out Your Cut Sheet',
              date: 'Before butcher date',
              description: 'Tell the butcher exactly how you want your beef cut — steak thickness, roast size, ground beef ratio, and more. You have until 1 week before butcher day.',
            },
            {
              icon: '🚛',
              title: 'We Transport to T-K Processing',
              date: 'Butcher day',
              description: 'We transport the cattle to T-K Processing in Cañon City and drop off your cut sheet in person. You don\'t lift a finger.',
            },
            {
              icon: '🥩',
              title: 'Dry Age 21–24 Days',
              date: '3 weeks later',
              description: 'Your beef is dry-aged for 21–24 days for maximum tenderness and flavor. During this time, yield reduces slightly — this is normal and expected.',
            },
            {
              icon: '📦',
              title: 'Cut, Vacuum-Sealed & Labeled',
              date: 'After aging',
              description: 'Everything is cut to your specs, vacuum-sealed, and labeled. A half beef fills about 4 boxes. We pick it up and bring it back to the ranch.',
            },
            {
              icon: '❄️',
              title: 'You Pick It Up',
              date: 'Est. 4–5 weeks after butcher',
              description: 'Schedule your pickup at 6105 Burgess Rd, Colorado Springs CO 80908. Pay your remaining balance and load up. Your beef is frozen solid and ready to go.',
            },
          ]} />
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 5: 3-Step Conversational Flow */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        {/* ── Step A: Ready prompt ── */}
        {step === 'idle' && (
          <section className="mb-12 text-center">
            <h2 className="font-display font-bold text-3xl text-brand-dark mb-4">
              Ready to reserve your beef?
            </h2>
            <p className="font-body text-brand-gray mb-8 max-w-sm mx-auto">
              Slots are limited. Our next butcher date is May 15, 2026.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep('intro')}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-lg px-10 py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-orange/30"
              >
                Yes, let&apos;s do it! →
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="border-2 border-brand-gray-light text-brand-gray font-body font-semibold text-lg px-8 py-4 rounded-xl hover:border-brand-dark hover:text-brand-dark transition-all"
              >
                Not yet
              </button>
            </div>
          </section>
        )}

        {/* ── Step B: Name + Email form ── */}
        {step === 'intro' && (
          <section className="mb-12">
            <div className="bg-white rounded-2xl shadow-sm border border-brand-gray-light p-8 max-w-lg mx-auto">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">👋</div>
                <h2 className="font-display font-bold text-2xl text-brand-dark mb-2">
                  We&apos;re excited to work with you!
                </h2>
                <p className="font-body text-brand-gray text-base">
                  Who are we reserving the beef for?
                </p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-body font-semibold text-brand-dark text-sm mb-1">
                      First name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="First"
                      className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm font-body text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block font-body font-semibold text-brand-dark text-sm mb-1">
                      Last name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Last"
                      className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm font-body text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-body font-semibold text-brand-dark text-sm mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    placeholder="you@example.com"
                    className={`w-full border rounded-xl px-4 py-3 text-sm font-body text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange ${
                      emailError
                        ? 'border-red-400 bg-red-50'
                        : 'border-[#E5E7EB]'
                    }`}
                  />
                  {emailError && (
                    <p className="font-body text-red-500 text-xs mt-1">
                      {emailError}
                    </p>
                  )}
                </div>
                <button
                  onClick={async () => {
                    if (!firstName.trim()) return;
                    if (!validateEmail(email)) {
                      setEmailError('Please enter a valid email address.');
                      return;
                    }
                    // Check if returning customer
                    try {
                      const res = await fetch(`/api/customers/lookup?email=${encodeURIComponent(email)}`);
                      if (res.ok) {
                        const data = await res.json();
                        if (data.customer) {
                          const nameParts = (data.customer.name || '').split(' ');
                          setFirstName(nameParts[0] || firstName);
                          setLastName(nameParts.slice(1).join(' ') || lastName);
                          // Store all their info for /book prefill
                          sessionStorage.setItem('customerPhone', data.customer.phone || '');
                          sessionStorage.setItem('customerAddress', data.customer.address || '');
                          sessionStorage.setItem('customerCity', data.customer.city || '');
                          sessionStorage.setItem('customerState', data.customer.state || '');
                          sessionStorage.setItem('customerZip', data.customer.zip || '');
                        }
                      }
                    } catch (_) {}
                    setStep('ready');
                  }}
                  disabled={!firstName.trim() || !email.trim()}
                  className="w-full bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-body font-bold text-lg py-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  Continue →
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Step C: Checkbox + CTA ── */}
        {step === 'ready' && (
          <section className="mb-12">
            <div className="bg-white rounded-2xl shadow-sm border border-brand-gray-light p-8 max-w-lg mx-auto">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">✅</div>
                <h2 className="font-display font-bold text-2xl text-brand-dark mb-2">
                  Almost there, {firstName}!
                </h2>
                <p className="font-body text-brand-gray text-sm">
                  One last thing before we pick your beef.
                </p>
              </div>
              <label className="flex items-start gap-4 cursor-pointer mb-6 group p-4 bg-brand-warm rounded-2xl border-2 border-transparent hover:border-brand-orange transition-colors">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors ${
                    checked
                      ? 'bg-brand-orange border-brand-orange'
                      : 'border-brand-gray-light group-hover:border-brand-orange'
                  }`}>
                    {checked && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-display font-bold text-brand-dark text-lg leading-tight mb-1">
                    I understand how beef pricing works
                  </p>
                  <p className="font-body text-brand-gray text-sm leading-relaxed">
                    My final price is based on{' '}
                    <strong>hanging weight</strong> — not live weight and not finished cuts. The hanging weight will vary by animal and I&apos;ll be notified of the exact weight before my balance is due.
                  </p>
                </div>
              </label>
              <Button
                onClick={handleContinue}
                disabled={!checked}
                fullWidth
                size="lg"
              >
                I Understand — Choose My Beef →
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
