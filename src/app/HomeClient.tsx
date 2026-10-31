'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import WeightExplainer from '@/components/WeightExplainer';
import Faq from '@/components/home/Faq';
import FadeIn from '@/components/ui/FadeIn';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import type { ShownPrices } from '@/lib/display-prices';
import type { SizeOffer } from '@/lib/shown-data';

/**
 * The 2026-10 homepage redesign ("board 6"): every fact said exactly once.
 * Hero → Know Your Beef (the three bullets + the slider) → What You'll
 * Actually Spend ($/lb first, estimates below) → From Deposit to Pickup Day →
 * dry aging → Rusty → the ranch → FAQ (the freezer video lives there now,
 * click-to-play) → close. The size calculator, how-it-works accordion and
 * gallery strip came out — the old page said the same things three ways.
 */

const SIZE_BLURB: Record<SizeOffer['size'], string> = {
  quarter: 'feeds 1–2 for most of a year',
  half: "a family's year of dinners",
  whole: 'two freezers, zero grocery runs',
};

const FREEZER_SPACE: Record<SizeOffer['size'], string> = {
  quarter: '4–5 ft³',
  half: '8 ft³',
  whole: '16 ft³',
};

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

export default function HomeClient({
  prices,
  sizes,
  nextButcherDate,
}: {
  prices: ShownPrices;
  sizes: SizeOffer[];
  nextButcherDate: string | null;
}) {
  const soldOut = sizes.every((s) => s.spotsRemaining <= 0);
  const halvesLeft = sizes.find((s) => s.size === 'half')?.spotsRemaining ?? 0;
  const ordered = (['quarter', 'half', 'whole'] as const)
    .map((size) => sizes.find((s) => s.size === size))
    .filter((s): s is SizeOffer => Boolean(s));

  const reserveHref = '/weight-explainer';

  return (
    <main className="min-h-screen bg-brand-warm">
      <SiteNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex items-end overflow-hidden" style={{ minHeight: 'min(74vh, 640px)' }}>
        <Image
          src="/images/hero_pasture.jpg"
          alt="Cattle on our Black Forest, Colorado pasture"
          fill
          className="object-cover object-[center_45%]"
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(9,18,12,.90) 0%, rgba(9,18,12,.52) 42%, rgba(9,18,12,.14) 72%)',
          }}
        />

        <div className="relative z-10 w-full max-w-[1140px] mx-auto px-5 pt-12 pb-13">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-[760px] pb-12"
          >
            <Image
              src="/images/LLC_Logo_white.svg"
              alt="Legacy Land &amp; Cattle"
              width={520}
              height={300}
              className="h-28 sm:h-36 w-auto mb-5 -ml-1"
              priority
            />

            {nextButcherDate && (
              <div className="inline-flex items-center gap-2.5 rounded px-4 py-2 mb-5 bg-white/10 border border-white/25 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" aria-hidden="true" />
                <span className="font-type text-white/90 text-[13px] tracking-wide uppercase">
                  Next harvest: <strong className="text-white">{nextButcherDate}</strong>
                  {halvesLeft > 0 && (
                    <>
                      {' · '}
                      <strong className="text-white">{halvesLeft}</strong> half shares left
                    </>
                  )}
                </span>
              </div>
            )}

            <h1
              className="font-slab text-white mb-4"
              style={{ fontSize: 'clamp(2.1rem, 6vw, 3.6rem)', lineHeight: 1.05 }}
            >
              LOCAL COLORADO BEEF, DIRECT FROM OUR RANCH TO YOU
            </h1>
            <p className="font-body text-white/85 text-lg mb-7 max-w-lg">
              Whole, half, or quarter beef — customized exactly how you want it.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="#know-your-beef"
                className="bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-[15px] tracking-wide px-7 py-3.5 rounded-md transition-colors"
              >
                START HERE
              </a>
              <a
                href="#pricing"
                className="bg-white/10 hover:bg-white/20 border border-white/35 backdrop-blur-sm text-white font-body font-bold text-[15px] px-7 py-3.5 rounded-md transition-colors"
              >
                SKIP TO PRICING
              </a>
            </div>

            <div className="flex flex-wrap gap-2.5 mt-5">
              <span className="bg-white/12 border border-white/30 text-white font-body font-bold text-xs tracking-wide px-3.5 py-1.5 rounded">
                100% GRASS-FED &amp; FINISHED
              </span>
              <span className="bg-white/12 border border-white/30 text-white font-body font-bold text-xs tracking-wide px-3.5 py-1.5 rounded">
                GRAIN-FINISHED
              </span>
              <span className="bg-brand-gold/25 border border-brand-gold text-[#F3E3C3] font-body font-bold text-xs tracking-wide px-3.5 py-1.5 rounded">
                AMERICAN WAGYU · SELECT TIMES OF YEAR
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Know your beef ───────────────────────────────────────────────── */}
      <section id="know-your-beef" className="scroll-mt-24 py-16 px-5">
        <div className="max-w-[1140px] mx-auto grid lg:grid-cols-[1fr_1.25fr] gap-12 items-start">
          <FadeIn>
            <div>
              <h2 className="font-slab text-brand-green text-3xl md:text-4xl leading-tight mb-4">
                KNOW YOUR BEEF BEFORE YOU BUY
              </h2>
              <p className="font-body text-brand-gray text-base leading-relaxed mb-6">
                One of the most common surprises for first-time bulk beef buyers is yield.
                Here&apos;s exactly what to expect.
              </p>
              <div>
                <div className="py-4 border-t-2 border-brand-green">
                  <p className="font-body font-bold text-brand-dark text-[15px] mb-1">
                    ⚖️ Price is charged on hanging weight
                  </p>
                  <p className="font-body text-brand-gray text-sm leading-relaxed">
                    Hanging weight is what remains after the animal is harvested and cleaned.
                  </p>
                </div>
                <div className="py-4 border-t border-dashed border-brand-green/40">
                  <p className="font-body font-bold text-brand-dark text-[15px] mb-1">
                    💰 Pricing varies by purchase size
                  </p>
                  <p className="font-body text-brand-gray text-sm leading-relaxed">
                    Whole beef: ${prices.whole.toFixed(2)}/lb · Half beef: ${prices.half.toFixed(2)}/lb ·
                    Quarter beef: ${prices.quarter.toFixed(2)}/lb. The more you buy, the better the price.
                  </p>
                </div>
                <div className="py-4 border-t border-dashed border-brand-green/40 border-b-2 border-b-brand-green">
                  <p className="font-body font-bold text-brand-dark text-[15px] mb-1">
                    🚛 Transportation &amp; processing included
                  </p>
                  <p className="font-body text-brand-gray text-sm leading-relaxed">
                    Your price covers everything from raising, transport to the butcher, processing,
                    vacuum sealing, and labeling.
                  </p>
                </div>
              </div>
              <p className="font-body text-brand-gray text-sm mt-5">
                Wondering what you&apos;ll get to choose?{' '}
                <Link href="/sample-cut-sheet" className="text-brand-orange font-semibold underline underline-offset-2">
                  See a sample cut sheet
                </Link>{' '}
                — every section, every option.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.08}>
            <div className="bg-white border border-brand-green/15 rounded-md shadow-[0_12px_30px_rgba(26,61,43,.1)] p-6 sm:p-8">
              <p className="font-type text-[#BF3B2B] text-[13px] tracking-widest mb-1">
                NO TWO STEERS ARE THE SAME SIZE — SLIDE ONE
              </p>
              <h3 className="font-slab text-brand-dark text-xl mb-5">
                Follow a steer from pasture to your freezer
              </h3>
              <WeightExplainer prices={prices} />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── What you'll actually spend ───────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-24 bg-brand-green py-16 px-5">
        <div className="max-w-[1140px] mx-auto">
          <FadeIn>
            <div className="flex flex-wrap items-baseline justify-between gap-4 mb-10">
              <h2 className="font-slab text-brand-warm text-3xl md:text-4xl">
                WHAT YOU&apos;LL ACTUALLY SPEND
              </h2>
              <p className="font-type text-brand-gold text-[13px] tracking-wide uppercase">
                Totals assume a typical steer — yours sets the final number
              </p>
            </div>
          </FadeIn>

          {ordered.length > 0 ? (
            <FadeIn>
              <div className="grid md:grid-cols-3 gap-5">
                {ordered.map((s) => {
                  const featured = s.size === 'half';
                  return (
                    <div
                      key={s.size}
                      className={`bg-brand-warm rounded-md p-7 flex flex-col gap-3.5 relative ${
                        featured ? 'outline outline-[3px] outline-brand-orange' : ''
                      }`}
                    >
                      {featured && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-orange text-white font-type text-xs tracking-widest px-3.5 py-1 rounded whitespace-nowrap">
                          MOST FAMILIES PICK THIS
                        </div>
                      )}
                      <div>
                        <p className="font-slab text-brand-dark text-[22px] uppercase">{s.label}</p>
                        <p className="font-body text-brand-gray text-[13px]">{SIZE_BLURB[s.size]}</p>
                      </div>
                      <p className="font-slab text-brand-dark text-4xl">
                        ${s.pricePerLb.toFixed(2)}
                        <span className="font-body font-semibold text-brand-gray text-[15px]"> /lb hanging</span>
                      </p>
                      <div className="font-body text-sm text-[#44503F] tabular-nums">
                        <div className="flex justify-between py-1.5 border-b border-dashed border-brand-green/30">
                          <span>Est. total</span>
                          <strong>{money(s.estLow)}–{money(s.estHigh)}</strong>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-dashed border-brand-green/30">
                          <span>Deposit today</span>
                          <strong>{money(s.depositAmount)}</strong>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-dashed border-brand-green/30">
                          <span>In your freezer</span>
                          <strong>~{s.boxedLow}–{s.boxedHigh} lb</strong>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span>Freezer space</span>
                          <strong>{FREEZER_SPACE[s.size]}</strong>
                        </div>
                      </div>
                      {!soldOut && s.spotsRemaining > 0 && (
                        <p className="font-type text-[#BF3B2B] text-xs tracking-wide">
                          {s.spotsRemaining} {s.spotsRemaining === 1 ? 'spot' : 'spots'} left this harvest
                        </p>
                      )}
                      <Link
                        href={soldOut || s.spotsRemaining <= 0 ? '/select-size' : reserveHref}
                        className={`mt-auto text-center font-body font-bold text-sm tracking-wide px-4 py-3 rounded-md transition-colors ${
                          featured
                            ? 'bg-brand-orange hover:bg-brand-orange-hover text-white'
                            : 'border-2 border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white'
                        }`}
                      >
                        {soldOut || s.spotsRemaining <= 0
                          ? 'JOIN THE WAITLIST'
                          : `RESERVE A ${s.label.toUpperCase()}`}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </FadeIn>
          ) : (
            <div className="max-w-lg mx-auto bg-brand-warm rounded-md p-8 text-center">
              <h3 className="font-slab text-brand-dark text-xl mb-2">This harvest is fully claimed</h3>
              <p className="font-body text-brand-gray text-sm mb-5">
                Our shares sell out ahead of each butcher date. Leave your details and you&apos;ll
                hear about the next one first.
              </p>
              <Link
                href="/select-size"
                className="inline-block bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold px-6 py-3 rounded-md transition-colors"
              >
                Join the waitlist
              </Link>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2.5 mt-8">
            <span className="bg-white/10 border border-white/30 text-brand-warm font-body font-bold text-xs tracking-wide px-4 py-2 rounded">
              100% GRASS-FED &amp; FINISHED — SAME RATE
            </span>
            <span className="bg-white/10 border border-white/30 text-brand-warm font-body font-bold text-xs tracking-wide px-4 py-2 rounded">
              GRAIN-FINISHED — SAME RATE
            </span>
            <span className="bg-brand-gold/20 border border-brand-gold text-[#F3E3C3] font-body font-bold text-xs tracking-wide px-4 py-2 rounded">
              AMERICAN WAGYU · PREMIUM · SELECT TIMES OF YEAR
            </span>
          </div>
          <p className="font-body text-center text-white/55 text-[13px] mt-4">
            Splits welcome — go in on a share with another family.
          </p>
        </div>
      </section>

      {/* ── From deposit to pickup day ───────────────────────────────────── */}
      <section className="py-16 px-5">
        <div className="max-w-[1140px] mx-auto">
          <FadeIn>
            <h2 className="font-slab text-brand-green text-3xl md:text-4xl text-center mb-11">
              FROM DEPOSIT TO PICKUP DAY
            </h2>
          </FadeIn>
          <FadeIn>
            <div className="relative pt-2">
              <div
                aria-hidden="true"
                className="hidden md:block absolute left-[4%] right-[4%] top-[34px] h-[3px]"
                style={{ background: 'repeating-linear-gradient(90deg,#C4A46B 0 10px,transparent 10px 18px)' }}
              />
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  {
                    n: '1',
                    bg: 'bg-brand-orange text-white',
                    title: 'Today — reserve',
                    body: 'Your deposit holds the spot and locks your rate. It counts toward your total.',
                  },
                  {
                    n: '2',
                    bg: 'bg-brand-green text-white',
                    title: 'Until butcher day — $0',
                    body: "The herd grazes here in Black Forest. You fill out your cut sheet whenever you're ready.",
                  },
                  {
                    n: '3',
                    bg: 'bg-brand-green text-white',
                    title: 'The weight text — balance',
                    body: "We text your steer's exact hanging weight and exact balance. You see the math before you pay.",
                  },
                  {
                    n: '4',
                    bg: 'bg-brand-gold text-brand-dark',
                    title: '~3 weeks later — pickup',
                    body: 'Pick a window, drive to the ranch, we load your vacuum-sealed, labeled boxes.',
                  },
                ].map((step) => (
                  <div key={step.n} className="text-center">
                    <div
                      className={`relative w-12 h-12 rounded-full ${step.bg} flex items-center justify-center font-body font-bold text-lg mx-auto mb-3.5`}
                    >
                      {step.n}
                    </div>
                    <p className="font-body font-bold text-brand-dark text-[15px] mb-1">{step.title}</p>
                    <p className="font-body text-brand-gray text-[13.5px] leading-relaxed">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Dry aging ────────────────────────────────────────────────────── */}
      <section className="bg-brand-gold py-14 px-5">
        <div className="max-w-[1140px] mx-auto grid md:grid-cols-[auto_1fr] gap-10 items-center">
          <FadeIn>
            <div className="text-center border-[3px] border-brand-dark rounded-md px-9 py-6 bg-brand-warm/40 w-fit mx-auto">
              <p className="font-type text-brand-dark text-[13px] tracking-[0.14em]">DRY-AGED</p>
              <p className="font-slab text-brand-dark text-6xl leading-none my-1">21–24</p>
              <p className="font-type text-brand-dark text-[13px] tracking-[0.14em]">DAYS</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.08}>
            <div>
              <h2 className="font-slab text-brand-dark text-2xl md:text-3xl mb-3">
                AGED LIKE A STEAKHOUSE, NOT A SUPERMARKET
              </h2>
              <p className="font-body text-[#2E2A1E] text-base leading-relaxed mb-2.5">
                Every animal hangs in the cooler for <strong>21 to 24 days</strong> before cutting.
                Dry aging lets natural enzymes tenderize the muscle while moisture slowly leaves it,
                concentrating that deep, beefy flavor — it&apos;s the process steakhouses charge a
                premium for.
              </p>
              <p className="font-body text-[#2E2A1E] text-base leading-relaxed">
                Most grocery beef is cut within days and never truly ages. Yours shows up to the
                freezer already better than anything in the case.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Rusty ────────────────────────────────────────────────────────── */}
      <section className="bg-white border-y-[3px] border-brand-green py-16 px-5">
        <div className="max-w-[1140px] mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <FadeIn>
            <div>
              <p className="font-type text-[#BF3B2B] text-[13px] tracking-widest mb-2.5 uppercase">
                Questions? The office never closes.
              </p>
              <h2 className="font-slab text-brand-dark text-3xl md:text-4xl mb-3.5">ASK RUSTY ANYTHING</h2>
              <p className="font-body text-brand-gray text-base leading-relaxed mb-2.5">
                Freezer math, what&apos;s still open this harvest, what a share costs for a family
                your size — Rusty answers on the spot, any hour. You&apos;ll meet him by text the
                moment you reserve: he confirms your spot, sends your exact hanging weight, and
                helps you book your pickup window.
              </p>
              <p className="font-body text-brand-gray/80 text-[13.5px] leading-relaxed">
                Rusty is our AI office manager — trained on this ranch and nothing else. A real
                rancher reads every conversation.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.08}>
            <div className="bg-brand-warm border border-brand-green/15 rounded-md p-5 shadow-[0_12px_30px_rgba(26,61,43,.1)]">
              <div className="flex items-center gap-2.5 pb-3 border-b border-dashed border-brand-green/30 mb-3.5">
                <div className="w-9 h-9 rounded-full bg-brand-orange text-white flex items-center justify-center font-slab text-base">
                  R
                </div>
                <div>
                  <p className="font-body font-bold text-brand-dark text-sm m-0">Rusty · AI office manager</p>
                  <p className="font-body text-green-700 text-xs font-semibold m-0">● On duty now</p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="self-end bg-brand-green text-white font-body text-sm leading-relaxed px-3.5 py-2.5 rounded-xl rounded-br-sm max-w-[85%]">
                  We&apos;re a family of five — quarter or half?
                </div>
                <div className="self-start bg-white border border-brand-green/15 text-brand-dark font-body text-sm leading-relaxed px-3.5 py-2.5 rounded-xl rounded-bl-sm max-w-[85%]">
                  Five of you? A half. That&apos;s ~195 lb — about a year of dinners — and the
                  per-pound rate beats the quarter. You&apos;d need 8 ft³ of freezer. Want me to
                  check what&apos;s open?
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── The ranch ────────────────────────────────────────────────────── */}
      <section id="ranch" className="scroll-mt-24 py-16 px-5">
        <div className="max-w-[1140px] mx-auto grid md:grid-cols-2 gap-11 items-center">
          <FadeIn>
            <div className="relative rounded-md overflow-hidden aspect-[4/3] -rotate-1 shadow-[0_14px_34px_rgba(26,61,43,.18)]">
              <Image
                src="/images/IMG_9286.jpg"
                alt="Cattle at Legacy Land &amp; Cattle in Black Forest, Colorado"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </FadeIn>
          <FadeIn delay={0.08}>
            <div>
              <p className="font-type text-[#BF3B2B] text-[13px] tracking-widest uppercase mb-2.5">
                Who you&apos;re buying from
              </p>
              <h2 className="font-slab text-brand-dark text-3xl leading-tight mb-4">
                A WORKING RANCH, NOT A DISTRIBUTION COMPANY.
              </h2>
              <p className="font-body text-brand-gray leading-relaxed mb-4">
                Legacy Land &amp; Cattle raises cattle in Black Forest, just north of Colorado
                Springs. The animals graze here, we haul them to T-K Processing in Cañon City
                ourselves, and we hand you the boxes at the ranch.
              </p>
              <p className="font-body text-brand-gray leading-relaxed">
                That&apos;s the difference between this and a box of beef shipped from somewhere.
                One herd, one butcher, and a phone number that a person answers.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ (the freezer video lives here, click-to-play) ────────────── */}
      <section id="faq" className="scroll-mt-24 bg-white py-16 px-5">
        <FadeIn>
          <Faq />
        </FadeIn>
      </section>

      {/* ── Close ────────────────────────────────────────────────────────── */}
      <section className="bg-brand-green py-16 px-5 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-slab text-brand-warm text-3xl mb-3">
            {nextButcherDate ? `${nextButcherDate.toUpperCase()} IS OPEN NOW.` : 'RESERVE YOUR BEEF'}
          </h2>
          <p className="font-body text-white/70 mb-7 max-w-md mx-auto">
            Slots are limited. A deposit holds your spot and locks in your price per pound.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href={reserveHref}
              className="bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-[15px] tracking-wide px-7 py-3.5 rounded-md transition-colors"
            >
              RESERVE YOUR BEEF
            </Link>
            <a
              href="tel:+17192581777"
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-body font-bold text-[15px] px-7 py-3.5 rounded-md transition-colors"
            >
              CALL (719) 258-1777
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
