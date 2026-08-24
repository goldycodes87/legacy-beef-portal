'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import type { AccountData } from '@/lib/account';
import type { ShownPrices } from '@/lib/display-prices';

/**
 * The fast pass. A returning customer already gave us their name, address and
 * phone, so the only decisions left are what they want and when. The pricing
 * acknowledgment is deliberately still here — everyone confirms how the price
 * is calculated, every single order, no matter how many they have placed.
 */
export default function ReorderClient({
  account,
  prices,
}: {
  account: AccountData;
  prices: ShownPrices;
}) {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(false);
  const last = account.lastOrder;

  /** Fills the funnel's saved state so the later steps do not ask again. */
  function seed(sameAsLast: boolean) {
    const [firstName, ...rest] = (account.name || '').split(' ');
    sessionStorage.setItem('customerFirstName', firstName || '');
    sessionStorage.setItem('customerLastName', rest.join(' '));
    sessionStorage.setItem('customerEmail', account.email);
    sessionStorage.setItem('customerPhone', account.phone || '');
    sessionStorage.setItem('customerAddress', account.address || '');
    sessionStorage.setItem('customerCity', account.city || '');
    sessionStorage.setItem('customerState', account.state || '');
    sessionStorage.setItem('customerZip', account.zip || '');
    sessionStorage.setItem('customerReturning', 'true');

    // The acknowledgment is what /weight-explainer exists to collect, and it
    // has been collected on this page instead.
    sessionStorage.setItem('weightExplainerComplete', 'true');
    sessionStorage.setItem('pricingAcknowledgedAt', new Date().toISOString());

    // Lets the cut sheet offer to reuse the previous one.
    if (last) sessionStorage.setItem('reorderFromSessionId', last.id);

    if (sameAsLast && last) {
      sessionStorage.setItem('selectedSize', last.purchaseType);
      sessionStorage.setItem('animalTypePreference', last.animalType || 'no_preference');
      // A fast pass is a solo order; splitting is its own conversation.
      sessionStorage.setItem('isSplitting', 'false');
      sessionStorage.setItem('partnerEmails', JSON.stringify([]));
      sessionStorage.setItem('partnerNames', JSON.stringify([]));
      sessionStorage.setItem('groupSize', '1');
      sessionStorage.setItem('cutSheetChoice', 'none');
    }
  }

  function sameAsLastTime() {
    if (!acknowledged || !last) return;
    seed(true);
    router.push('/book');
  }

  function somethingDifferent() {
    if (!acknowledged) return;
    seed(false);
    router.push('/select-size');
  }

  const priceForLast = last
    ? prices[last.purchaseType as keyof ShownPrices] ?? last.pricePerLb
    : null;

  return (
    <div className="min-h-screen bg-brand-warm flex flex-col">
      <SiteNav />

      <main className="flex-1 max-w-[620px] w-full mx-auto px-4 py-12">
        <Link
          href="/account"
          className="font-body text-sm text-brand-gray hover:text-brand-dark transition-colors"
        >
          ← Back to my account
        </Link>

        <h1 className="font-display font-bold text-3xl text-brand-dark mt-4 mb-2">
          Reserve your beef, {account.firstName}.
        </h1>
        <p className="font-body text-brand-gray mb-8">
          We have your details on file, so this only takes a minute.
        </p>

        {/* Same as last time */}
        {last && (
          <div className="bg-white rounded-2xl border-2 border-brand-dark p-6 mb-4">
            <p className="font-body text-xs font-semibold uppercase tracking-wider text-brand-gray mb-2">
              Last time you ordered
            </p>
            <p className="font-display font-bold text-2xl text-brand-dark">
              {last.purchaseLabel}
              <span className="font-body font-normal text-brand-gray text-lg">
                {' '}
                · {last.animalTypeLabel}
              </span>
            </p>
            {priceForLast != null && (
              <p className="font-body text-sm text-brand-gray mt-1">
                ${priceForLast.toFixed(2)}/lb hanging weight at today&apos;s pricing
                {priceForLast !== last.pricePerLb && (
                  <span> — you paid ${last.pricePerLb.toFixed(2)}/lb last time</span>
                )}
              </p>
            )}

            <button
              type="button"
              onClick={sameAsLastTime}
              disabled={!acknowledged}
              className="w-full mt-5 bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-body font-bold text-lg py-4 rounded-xl transition-colors"
            >
              Yes — same as last time →
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={somethingDifferent}
          disabled={!acknowledged}
          className="w-full bg-white border-2 border-brand-gray-light hover:border-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-brand-dark font-body font-semibold text-base py-4 rounded-xl transition-colors mb-8"
        >
          {last ? 'Choose something different' : 'Choose your size'}
        </button>

        {/* Non-negotiable, every order, every time. */}
        <label className="flex items-start gap-4 cursor-pointer group p-5 bg-white rounded-2xl border-2 border-transparent hover:border-brand-orange transition-colors">
          <span className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="sr-only"
            />
            <span
              className={`block w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors ${
                acknowledged
                  ? 'bg-brand-orange border-brand-orange'
                  : 'border-brand-gray-light group-hover:border-brand-orange'
              }`}
            >
              {acknowledged && (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
          </span>
          <span>
            <span className="block font-display font-bold text-brand-dark text-lg leading-tight mb-1">
              I understand how beef pricing works
            </span>
            <span className="block font-body text-brand-gray text-sm leading-relaxed">
              My final price is based on <strong>hanging weight</strong> — not live weight and not
              finished cuts. The hanging weight will vary by animal and I&apos;ll be notified of the
              exact weight before my balance is due.
            </span>
          </span>
        </label>

        {!acknowledged && (
          <p className="font-body text-brand-gray text-sm text-center mt-4">
            Check the box above to continue.
          </p>
        )}

        <p className="font-body text-brand-gray text-sm text-center mt-8">
          Need a refresher on hanging weight?{' '}
          <Link href="/#know-your-beef" className="text-brand-orange font-semibold">
            It&apos;s all on the home page
          </Link>
          .
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
