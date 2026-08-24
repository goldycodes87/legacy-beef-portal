'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import WeightExplainer from '@/components/WeightExplainer';
import BeefCalculator from '@/components/BeefCalculator';
import HowItWorks from '@/components/HowItWorks';
import ShareCards from '@/components/home/ShareCards';
import Faq from '@/components/home/Faq';
import FadeIn from '@/components/ui/FadeIn';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import type { ShownPrices } from '@/lib/display-prices';
import type { SizeOffer } from '@/lib/shown-data';

/**
 * Ranch photography for the home page. These four also appear in the
 * how-it-works steps, but that is an accordion — only the open step's photo is
 * on screen — so without this strip the page shows almost no cattle.
 */
const GALLERY = [
  { src: '/images/20250406_133350.jpg', alt: 'Cattle on the Black Forest pasture' },
  { src: '/images/Rocko.jpg', alt: 'One of our steers' },
  { src: '/images/FB_IMG_1775754831097.jpg', alt: 'The herd at the fence line' },
  { src: '/images/FB_IMG_1775754857081.jpg', alt: 'Pasture at the ranch' },
];

export default function HomeClient({
  prices,
  sizes,
  nextButcherDate,
}: {
  prices: ShownPrices;
  sizes: SizeOffer[];
  nextButcherDate: string | null;
}) {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);

  const totalLeft = sizes.find((s) => s.size === 'half')?.spotsRemaining ?? 0;

  return (
    <main className="min-h-screen bg-brand-warm">
      <SiteNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex items-end overflow-hidden"
        style={{ minHeight: 'min(72vh, 620px)' }}
      >
        <motion.div style={{ y: heroY }} className="absolute inset-0 scale-110">
          <Image
            src="/images/hero_pasture.jpg"
            alt="Cattle on our Black Forest, Colorado pasture"
            fill
            className="object-cover object-[center_45%]"
            priority
            sizes="100vw"
          />
        </motion.div>
        {/* Gradient rather than a flat wash, so the cattle stay visible. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(9,18,12,.90) 0%, rgba(9,18,12,.55) 34%, rgba(9,18,12,.16) 66%, rgba(9,18,12,.34) 100%)',
          }}
        />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-5 pb-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-[660px]"
          >
            <Image
              src="/images/LLC_Logo_white.svg"
              alt="Legacy Land &amp; Cattle"
              width={520}
              height={300}
              className="h-28 sm:h-36 md:h-44 w-auto mb-6 -ml-1"
              priority
            />

            {nextButcherDate && (
              <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 mb-5 bg-white/10 border border-white/20 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" aria-hidden="true" />
                <span className="font-body text-white/90 text-[13px]">
                  Next butcher date <strong className="text-white">{nextButcherDate}</strong>
                  {totalLeft > 0 && (
                    <>
                      {' · '}
                      <strong className="text-white">{totalLeft}</strong> half shares left
                    </>
                  )}
                </span>
              </div>
            )}

            <h1
              className="font-display font-black text-white mb-4"
              style={{ fontSize: 'clamp(2.1rem, 6.5vw, 3.25rem)', lineHeight: 1.08 }}
            >
              Local Colorado Beef, Direct from Our Ranch to You
            </h1>
            <p className="font-body text-white/80 text-lg mb-7 max-w-lg">
              Reserve your share of the harvest. Whole, half, or quarter beef — customized exactly
              how you want it.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="#know-your-beef"
                className="bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-base px-7 py-3.5 rounded-xl transition-colors"
              >
                Start here
              </a>
              <a
                href="#pricing"
                className="bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-sm text-white font-body font-semibold text-base px-7 py-3.5 rounded-xl transition-colors"
              >
                Skip to pricing
              </a>
            </div>

            <p className="font-body text-white/60 text-sm mt-4">
              2026 slots are filling fast. Grass-fed &amp; grain-finished available.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Returning customers ──────────────────────────────────────────── */}
      <section className="bg-brand-dark border-t border-white/10">
        <div className="max-w-5xl mx-auto px-5 py-7 flex flex-wrap items-center justify-between gap-4">
          <p className="font-body text-white/70 text-base sm:text-lg m-0 leading-relaxed">
            <strong className="text-white">Bought from us before?</strong> Pick up where you left
            off — your details and last cut sheet are saved.
          </p>
          <Link
            href="/returning"
            className="font-body bg-white/10 hover:bg-white/20 border border-[#C4A46B]/50 hover:border-[#C4A46B] text-[#C4A46B] hover:text-white text-base font-semibold whitespace-nowrap px-6 py-3 rounded-xl transition-colors"
          >
            Sign in with your email →
          </Link>
        </div>
      </section>

      {/* ── Education first ──────────────────────────────────────────────── */}
      <section id="know-your-beef" className="scroll-mt-24 py-16 px-4">
        <div className="max-w-[760px] mx-auto">
          <FadeIn>
            <div className="text-center mb-10">
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-dark mb-4">
                Know Your Beef Before You Buy
              </h2>
              <p className="font-body text-brand-gray text-base leading-relaxed max-w-[560px] mx-auto">
                One of the most common surprises for first-time bulk beef buyers is yield.
                Here&apos;s exactly what to expect.
              </p>
            </div>
          </FadeIn>

          <FadeIn>
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
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 pb-3 border-b border-white/10 last:border-0 last:pb-0"
                  >
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="font-body font-semibold text-white text-sm">{item.title}</p>
                      <p className="font-body text-white/60 text-sm mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <p className="font-body text-brand-gray text-sm text-center mb-4">
            👇 Adjust the slider below to estimate your cost based on animal size.
          </p>

          <div className="overflow-x-auto max-w-full mb-16">
            <WeightExplainer prices={prices} />
          </div>

          <div className="text-center mb-8">
            <h2 className="font-display font-bold text-2xl text-brand-dark mb-2">Find Your Size</h2>
            <p className="font-body text-brand-gray text-sm">
              Use these tools to figure out what&apos;s right for your household.
            </p>
          </div>

          <div className="space-y-10">
            <BeefCalculator />

            <div>
              <h3 className="font-display font-bold text-xl text-brand-dark mb-2 text-center">
                Will It Fit In My Freezer?
              </h3>
              <p className="font-body text-brand-gray text-sm mb-4 text-center">
                Watch this quick video to see exactly how much freezer space you&apos;ll need.
              </p>
              <video
                controls
                preload="metadata"
                poster="/images/hero_pasture.jpg"
                className="w-full max-w-[750px] mx-auto block rounded-xl"
              >
                <source src="/videos/Freezervideo.mp4" type="video/mp4" />
                Your browser does not support video playback.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-24 bg-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10">
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-dark mb-3">
                Choose Your Share
              </h2>
              <p className="font-body text-brand-gray max-w-[540px] mx-auto">
                Now that hanging weight makes sense, here are the numbers. Estimates assume a
                typical animal — your final total follows the actual hanging weight.
              </p>
            </div>
          </FadeIn>

          {sizes.length > 0 ? (
            <FadeIn>
              <ShareCards sizes={sizes} />
            </FadeIn>
          ) : (
            <div className="max-w-lg mx-auto bg-brand-warm rounded-2xl p-8 text-center">
              <h3 className="font-display font-bold text-xl text-brand-dark mb-2">
                This harvest is fully claimed
              </h3>
              <p className="font-body text-brand-gray text-sm mb-5">
                Our shares sell out ahead of each butcher date. Leave your details and you&apos;ll
                hear about the next one first.
              </p>
              <Link
                href="/select-size"
                className="inline-block bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Join the waitlist
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Why buy this way (existing copy) ─────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Ranch Direct',
                  body: 'No middleman. Straight from our Black Forest, CO ranch to your freezer.',
                  path: 'M3 12h4l3-7 4 14 3-7h4',
                },
                {
                  title: 'Custom Cut',
                  body: 'You choose every cut — steaks, roasts, ground beef — exactly how your family likes it.',
                  path: 'M4 7h16M4 12h10M4 17h13',
                },
                {
                  title: 'Bulk Value',
                  body: 'Whole, half, or quarter beef priced by hanging weight. Fill your freezer for months.',
                  path: 'M12 3v18M5 8l7-5 7 5v8l-7 5-7-5z',
                },
              ].map((v, i) => (
                <FadeIn key={v.title} delay={i * 0.12}>
                  <div className="text-center">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="w-7 h-7 mx-auto mb-4 stroke-[#C4A46B] fill-none"
                      strokeWidth="1.4"
                    >
                      <path d={v.path} />
                    </svg>
                    <h3 className="font-display font-bold text-xl text-brand-dark mb-2">
                      {v.title}
                    </h3>
                    <p className="font-body text-brand-gray">{v.body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── How it works (existing component) ────────────────────────────── */}
      <HowItWorks />

      {/* ── The ranch ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="grid md:grid-cols-2 gap-10 items-center mb-10">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                <Image
                  src="/images/IMG_9286.jpg"
                  alt="Cattle at Legacy Land &amp; Cattle in Black Forest, Colorado"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div>
                <p className="font-body text-brand-orange text-xs font-semibold tracking-widest uppercase mb-3">
                  Who you&apos;re buying from
                </p>
                <h2 className="font-display font-bold text-3xl text-brand-dark mb-4">
                  A working ranch, not a distribution company.
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
            </div>
          </FadeIn>

          <FadeIn>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {GALLERY.map((g) => (
                <div key={g.src} className="relative aspect-square rounded-xl overflow-hidden">
                  <Image
                    src={g.src}
                    alt={g.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="bg-white py-16 px-4">
        <FadeIn>
          <Faq />
        </FadeIn>
      </section>

      {/* ── Close ────────────────────────────────────────────────────────── */}
      <section className="bg-brand-dark py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-white mb-3">
            {nextButcherDate ? `${nextButcherDate} is open now.` : 'Reserve your beef'}
          </h2>
          <p className="font-body text-white/70 mb-7 max-w-md mx-auto">
            Slots are limited. A deposit holds your spot and locks in your price per pound.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/weight-explainer"
              className="bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-base px-7 py-3.5 rounded-xl transition-colors"
            >
              Reserve your beef
            </Link>
            <a
              href="tel:+17192581777"
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-body font-semibold text-base px-7 py-3.5 rounded-xl transition-colors"
            >
              Call (719) 258-1777
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
