'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import ScrollButton from '@/components/ui/ScrollButton';
import HowItWorks from '@/components/HowItWorks';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import FadeIn from '@/components/ui/FadeIn';

export default function HomePage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  return (
    <main className="min-h-screen bg-brand-warm">
      {/* Hero Section */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0 scale-110">
          <Image
            src="/images/hero_pasture.jpg"
            alt="Black Forest Cattle Ranch"
            fill
            className="object-cover object-[center_40%]"
            priority
          />
        </motion.div>
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 max-w-content text-center px-4">
          {/* Logo */}
          <motion.div 
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Image
              src="/images/LLC_Logo_white.svg"
              alt="Legacy Land & Cattle"
              width={300}
              height={130}
              className="h-36 md:h-64 w-auto mb-6"
              priority
            />
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="font-display font-black text-white mb-4"
            style={{ fontSize: 'clamp(2.25rem, 10vw, 3.25rem)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Local Colorado Beef, Direct from Our Ranch to You
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            className="font-body text-white/80 text-lg mb-8 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            Reserve your share of the harvest. Whole, half, or quarter beef — customized exactly how you want it.
          </motion.p>

          {/* Scroll Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <ScrollButton />
          </motion.div>

          {/* Secondary skip link */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65 }}
          >
            <Link href="/weight-explainer" className="font-body text-white/60 text-sm underline underline-offset-4 hover:text-white/80 transition-colors">
              Ready to reserve? Skip ahead →
            </Link>
          </motion.div>

          {/* Small Text */}
          <p className="font-body text-white/60 text-sm mt-4">
            2026 slots are filling fast. Grass-fed & grain-finished available.
          </p>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-wide mx-auto">
          <FadeIn>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Value Prop 1 */}
              <FadeIn delay={0}>
                <div className="text-center">
                  <div className="text-4xl mb-4">🐄</div>
                  <h3 className="font-display font-bold text-xl text-brand-dark mb-2">Ranch Direct</h3>
                  <p className="font-body text-brand-gray">
                    No middleman. Straight from our Black Forest, CO ranch to your freezer.
                  </p>
                </div>
              </FadeIn>

              {/* Value Prop 2 */}
              <FadeIn delay={0.15}>
                <div className="text-center">
                  <div className="text-4xl mb-4">✂️</div>
                  <h3 className="font-display font-bold text-xl text-brand-dark mb-2">Custom Cut</h3>
                  <p className="font-body text-brand-gray">
                    You choose every cut — steaks, roasts, ground beef — exactly how your family likes it.
                  </p>
                </div>
              </FadeIn>

              {/* Value Prop 3 */}
              <FadeIn delay={0.3}>
                <div className="text-center">
                  <div className="text-4xl mb-4">❄️</div>
                  <h3 className="font-display font-bold text-xl text-brand-dark mb-2">Bulk Value</h3>
                  <p className="font-body text-brand-gray">
                    Whole, half, or quarter beef at $8.00–$8.50/lb hanging weight. Fill your freezer for months.
                  </p>
                </div>
              </FadeIn>
            </div>
          </FadeIn>
        </div>
      </section>

      <HowItWorks />
    </main>
  );
}
