'use client';

import Link from 'next/link';

/**
 * Top bar for the marketing pages, matching the 2026-10 redesign: cream bar,
 * slab wordmark, section links, and two equal orange buttons — returning
 * customers get the same visual weight as new reservations. The funnel's
 * deeper pages use their own step header instead.
 */
export default function SiteNav() {
  return (
    <header className="sticky top-0 z-40 bg-brand-warm/95 backdrop-blur supports-[backdrop-filter]:bg-brand-warm/85 border-b-[3px] border-brand-green">
      <nav
        aria-label="Main"
        className="max-w-[1140px] mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
      >
        <Link
          href="/"
          className="font-slab text-lg text-brand-green whitespace-nowrap"
          aria-label="Legacy Land &amp; Cattle home"
        >
          LEGACY LAND &amp; CATTLE
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-body font-bold text-brand-green">
          <Link href="/#know-your-beef" className="hover:text-brand-orange transition-colors">KNOW YOUR BEEF</Link>
          <Link href="/#pricing" className="hover:text-brand-orange transition-colors">PRICING</Link>
          <Link href="/#ranch" className="hover:text-brand-orange transition-colors">THE RANCH</Link>
          <Link href="/#faq" className="hover:text-brand-orange transition-colors">FAQ</Link>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/returning"
            className="bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-[13px] tracking-wide px-4 py-2.5 rounded-md transition-colors whitespace-nowrap"
          >
            BOUGHT BEFORE? SIGN IN
          </Link>
          <Link
            href="/weight-explainer"
            className="bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-[13px] tracking-wide px-4 py-2.5 rounded-md transition-colors whitespace-nowrap"
          >
            RESERVE YOUR BEEF
          </Link>
        </div>
      </nav>
    </header>
  );
}
