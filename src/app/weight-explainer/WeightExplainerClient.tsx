'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ReservationProgress from '@/components/ReservationProgress';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import SiteFooter from '@/components/SiteFooter';
import type { ShownPrices } from '@/lib/display-prices';

/**
 * Prices and the next butcher date arrive from the server component so the
 * first paint is already correct. Fetching them here meant the page rendered
 * fallback figures first, which is what a search engine indexed and what a
 * customer briefly saw — the wrong price.
 */
export default function WeightExplainerClient({
  prices,
  nextButcherDate,
}: {
  prices: ShownPrices;
  nextButcherDate: string | null;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [step, setStep] = useState<'idle'|'intro'|'form'|'ready'>('idle');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

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
                desc: 'Hanging weight is what remains after the animal is harvested and cleaned.',
              },
              {
                icon: '💰',
                title: 'Pricing varies by purchase size',
                desc: `Whole beef: $${prices.whole.toFixed(2)}/lb · Half beef: $${prices.half.toFixed(2)}/lb · Quarter beef: $${prices.quarter.toFixed(2)}/lb. The more you buy, the better the price.`,
              },
              {
                icon: '🚛',
                title: 'Transportation & processing included',
                desc: 'Your price covers everything from raising, transport to the butcher, processing, vacuum sealing, and labeling.',
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

        {/* The slider, the size calculator and the freezer video all live on
            the home page. Repeating them here made this read as the same page
            twice, so point at the one copy instead. */}
        <p className="font-body text-brand-gray text-sm text-center">
          Want the full walkthrough — the weight slider, the size calculator and the
          freezer video?{' '}
          <Link
            href="/#know-your-beef"
            className="text-brand-orange font-semibold underline underline-offset-2"
          >
            It&apos;s all on the home page
          </Link>
          {' '}— and you can{' '}
          <Link
            href="/sample-cut-sheet"
            className="text-brand-orange font-semibold underline underline-offset-2"
          >
            preview the cut sheet
          </Link>
          .
        </p>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: 3-Step Conversational Flow */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        {/* ── Step A: Ready prompt ── */}
        {step === 'idle' && (
          <section className="mt-12 mb-12 text-center">
            <h2 className="font-display font-bold text-3xl text-brand-dark mb-4">
              Ready to reserve your beef?
            </h2>
            <p className="font-body text-brand-gray mb-8 max-w-sm mx-auto">
              Slots are limited.{nextButcherDate ? ` Our next butcher date is ${nextButcherDate}.` : ''}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep('intro')}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-lg px-10 py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-orange/30"
              >
                Yes, let&apos;s do it! →
              </button>
              <button
                onClick={() => router.push('/#know-your-beef')}
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
                    // Note whether this is a returning customer. Their saved
                    // details are not prefilled — see /api/customers/lookup.
                    try {
                      const res = await fetch('/api/customers/lookup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        sessionStorage.setItem('customerReturning', data.known ? 'true' : 'false');
                      }
                    } catch {
                      // Not knowing is fine — the booking form collects everything.
                    }
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

      <SiteFooter />
    </div>
  );
}
