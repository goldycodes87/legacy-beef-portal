'use client';

import Image from 'next/image';
import Link from 'next/link';

/**
 * Minimal top bar for the marketing pages. Keeps the phone number and a way to
 * start a reservation on screen without competing with the funnel's own
 * step header, which the deeper pages use instead.
 */
export default function SiteNav() {
  return (
    <header className="sticky top-0 z-40 bg-brand-dark/95 backdrop-blur supports-[backdrop-filter]:bg-brand-dark/80">
      <nav
        aria-label="Main"
        className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between gap-3"
      >
        <Link href="/" className="flex items-center" aria-label="Legacy Land &amp; Cattle home">
          <Image
            src="/images/LLC_Logo_white.svg"
            alt="Legacy Land &amp; Cattle"
            width={260}
            height={150}
            className="h-14 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href="tel:+17192581777"
            className="hidden sm:inline text-white/75 hover:text-white text-sm font-body transition-colors"
          >
            (719) 258-1777
          </a>
          <Link
            href="/#how-it-works"
            className="hidden sm:inline text-white/75 hover:text-white text-sm font-body transition-colors"
          >
            How it works
          </Link>
          <Link
            href="/weight-explainer"
            className="bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-semibold text-sm px-4 py-2 rounded-full transition-colors"
          >
            Reserve
          </Link>
        </div>
      </nav>
    </header>
  );
}
