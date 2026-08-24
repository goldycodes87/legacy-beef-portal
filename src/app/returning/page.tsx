'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

function ReturningForm() {
  const params = useSearchParams();
  const expired = params.get('expired') === '1';
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setState('sending');
    try {
      const res = await fetch('/api/returning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setState('idle');
        return;
      }
      setState('sent');
    } catch {
      setError('We could not reach the server. Please try again, or call us.');
      setState('idle');
    }
  }

  return (
    <div className="min-h-screen bg-brand-warm flex flex-col">
      <SiteNav />

      <main className="flex-1 max-w-[520px] w-full mx-auto px-4 py-16">
        {state === 'sent' ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-3" aria-hidden="true">✓</div>
            <h1 className="font-display font-bold text-2xl text-brand-dark mb-3">
              Check your email
            </h1>
            <p className="font-body text-brand-gray text-sm leading-relaxed">
              If we have an order for <strong className="text-brand-dark">{email}</strong>, a link
              back into it is on its way. It opens your cut sheet, your balance and your pickup
              details — no password needed.
            </p>
            <p className="font-body text-brand-gray text-sm mt-5">
              Didn&apos;t get it? Call us at{' '}
              <a href="tel:+17192581777" className="text-brand-orange font-semibold">
                (719) 258-1777
              </a>
              .
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-display font-bold text-3xl text-brand-dark mb-3">
              Welcome back
            </h1>

            {expired && (
              <p className="font-body text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-4">
                Your last link expired. Enter your email and we&apos;ll send a fresh one.
              </p>
            )}
            <p className="font-body text-brand-gray mb-8 leading-relaxed">
              Enter the email you used before and we&apos;ll send you a link straight into your
              order — your details and your last cut sheet are saved. No password to remember.
            </p>

            <form onSubmit={submit} className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <label
                htmlFor="returning-email"
                className="block font-body font-semibold text-brand-dark mb-2"
              >
                Email address
              </label>
              <input
                id="returning-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                required
                className="w-full border-2 border-brand-gray-light rounded-xl px-4 py-3 font-body text-brand-dark focus:outline-none focus:border-brand-orange"
              />

              {error && <p className="font-body text-red-600 text-sm mt-2">{error}</p>}

              <button
                type="submit"
                disabled={state === 'sending'}
                className="w-full mt-4 bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-lg py-4 rounded-xl transition-colors disabled:opacity-50"
              >
                {state === 'sending' ? 'Sending…' : 'Send me my link'}
              </button>
            </form>

            <p className="font-body text-center text-sm text-brand-gray mt-6">
              First time buying?{' '}
              <Link href="/weight-explainer" className="text-brand-orange font-semibold">
                Start here instead →
              </Link>
            </p>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

export default function ReturningPage() {
  return (
    <Suspense fallback={null}>
      <ReturningForm />
    </Suspense>
  );
}
