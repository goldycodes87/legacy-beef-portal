import Link from 'next/link';
import type { Metadata } from 'next';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'That link has expired',
  robots: { index: false, follow: false },
};

/**
 * Where /api/token/[token] sends anyone whose link is expired or unrecognised.
 * This page did not exist, so every one of those customers hit a raw 404 —
 * on a link we emailed them.
 */
export default function AccessExpiredPage() {
  return (
    <div className="min-h-screen bg-brand-warm flex flex-col">
      <SiteNav />

      <main className="flex-1 max-w-[520px] w-full mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-3" aria-hidden="true">
            ⏳
          </div>
          <h1 className="font-display font-bold text-2xl text-brand-dark mb-3">
            That link has expired
          </h1>
          <p className="font-body text-brand-gray text-sm leading-relaxed mb-6">
            Order links stop working after a while to keep your details safe. Enter your email and
            we&apos;ll send you a fresh one — it opens your account, your cut sheets and your
            invoices.
          </p>
          <Link
            href="/returning"
            className="inline-block w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-lg py-4 rounded-xl transition-colors"
          >
            Send me a new link
          </Link>
        </div>

        <p className="font-body text-center text-sm text-brand-gray mt-6">
          Rather talk to someone?{' '}
          <a href="tel:+17192581777" className="text-brand-orange font-semibold">
            (719) 258-1777
          </a>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
