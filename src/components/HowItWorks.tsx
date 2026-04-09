'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FadeIn from '@/components/ui/FadeIn';
import { GlassFilter } from '@/components/ui/glass-filter';
import { GlassCard } from '@/components/ui/glass-card';

const steps = [
  {
    num: '1',
    title: 'Reserve Your Spot',
    icon: '🐄',
    image: '/images/20250406_133350.jpg',
    short: 'Choose your size and pay your deposit.',
    detail: `Pick a whole, half, or quarter beef — or split with friends to save. Not sure how much you need? Use our calculator on the next page to find your perfect size.

Pay your deposit to lock in your spot and choose the butcher date that works best for you. Beef is dry-aged 21–24 days after butcher, so your estimated pickup is about 3–4 weeks out. Our prices are all-inclusive — processing, transport to and from the butcher, everything. No surprises.`,
  },
  {
    num: '2',
    title: 'Build Your Cut Sheet',
    icon: '✂️',
    image: '/images/Rocko.jpg',
    short: 'Tell the butcher exactly how you want it cut.',
    detail: `This is where it gets fun. You decide everything — steak thickness, roast size, how much ground beef, whether you want organs or bones.

Half and whole buyers get a fully custom cut sheet. Quarter buyers use our House Cut Sheet, which is a well-rounded selection that works great for most families. You can also split a whole beef with friends to unlock a custom sheet at the quarter price.`,
  },
  {
    num: '3',
    title: 'We Handle Everything',
    icon: '🚛',
    image: '/images/FB_IMG_1775754831097.jpg',
    short: 'From ranch to butcher and back — stress free.',
    detail: `We raise the cattle right here in Colorado Springs, transport them to T-K Processing in Cañon City, and drop off your cut sheet in person.

Your beef is dry-aged 21–24 days for maximum tenderness and flavor, then cut, vacuum-sealed, and labeled to your exact specifications. We pick it up and bring it back to the ranch — you don't lift a finger.`,
  },
  {
    num: '4',
    title: 'Pick Up Your Beef',
    icon: '❄️',
    image: '/images/FB_IMG_1775754857081.jpg',
    short: 'Choose a time, come to the ranch, load up.',
    detail: `Once your beef is ready, you'll get an email to schedule your pickup.

Your beef arrives frozen solid, professionally packed in labeled boxes. A quarter is about 2 boxes, a half is about 4, and a whole is 8–10. Bring a cooler or we can help you load straight into your vehicle. Pay your remaining balance in advance or at pickup — cash, check, or card accepted.`,
  },
];

export default function HowItWorks() {
  const [active, setActive] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);



  const handleCardInteraction = (i: number) => {
    if (isMobile) {
      setActive(active === i ? null : i);
    }
  };

  const handleMouseEnter = (i: number) => {
    if (!isMobile) setActive(i);
  };

  const handleMouseLeave = () => {
    if (!isMobile) setActive(null);
  };

  return (
    <section id="how-it-works" className="relative bg-brand-dark py-24 px-4 overflow-hidden" style={{overflowAnchor: "none"}}>
      <GlassFilter />

      {/* Illuminated glow behind headline */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 pointer-events-none">
        <div
          className="absolute inset-0 animate-[onloadbgt_1.5s_ease-in-out_forwards] opacity-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(232,93,36,0.35) 0%, transparent 70%)',
            transform: 'translateY(-20%)',
          }}
        />
      </div>

      <style>{`
        @keyframes onloadbgt {
          0% { opacity: 0; transform: translateY(-30%); }
          100% { opacity: 1; transform: translateY(-10%); }
        }
      `}</style>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section header */}
        <FadeIn>
          <p className="font-body text-brand-orange text-sm font-semibold tracking-widest uppercase text-center mb-4">
            The Process
          </p>

          {/* Illuminated headline with glow filter */}
          <div className="text-center mb-4">
            <svg className="absolute -z-1 h-0 w-0" width="0" height="0">
              <defs>
                <filter
                  id="glow-4"
                  colorInterpolationFilters="sRGB"
                  x="-50%"
                  y="-200%"
                  width="200%"
                  height="500%"
                >
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur4" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="19" result="blur19" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur9" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur30" />
                  <feColorMatrix
                    in="blur4"
                    result="color-0-blur"
                    type="matrix"
                    values="1 0 0 0 0 0 0.98 0 0 0 0 0 0.96 0 0 0 0 0 0.8 0"
                  />
                  <feOffset in="color-0-blur" result="layer-0" dx="0" dy="0" />
                  <feColorMatrix
                    in="blur19"
                    result="color-1-blur"
                    type="matrix"
                    values="0.91 0 0 0 0 0 0.36 0 0 0 0 0 0.14 0 0 0 0 0 1 0"
                  />
                  <feOffset in="color-1-blur" result="layer-1" dx="0" dy="2" />
                  <feColorMatrix
                    in="blur30"
                    result="color-2-blur"
                    type="matrix"
                    values="0.91 0 0 0 0 0 0.36 0 0 0 0 0 0.14 0 0 0 0 0 1 0"
                  />
                  <feOffset in="color-2-blur" result="layer-2" dx="0" dy="16" />
                  <feMerge>
                    <feMergeNode in="layer-0" />
                    <feMergeNode in="layer-1" />
                    <feMergeNode in="layer-2" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>
            <h2
              className="font-display font-black text-white inline-block"
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                filter: 'url(#glow-4)',
              }}
            >
              From Pasture to Freezer
            </h2>
          </div>

          <p className="font-body text-white/50 text-center text-lg mb-16 max-w-lg mx-auto">
            We handle everything. Here's exactly what happens after you reserve.
          </p>
        </FadeIn>

        {/* Step cards — vertical accordion with glass effect */}
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}
            >
              <GlassCard
                className="rounded-2xl border border-white/10 hover:border-white/25"
                onMouseEnter={() => handleMouseEnter(i)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleCardInteraction(i)}
              >
                {/* Always-visible header row */}
                <div className="flex items-center gap-6 p-6">
                  <div className="w-12 h-12 rounded-full bg-brand-orange text-white font-display font-bold flex items-center justify-center text-lg flex-shrink-0 shadow-lg shadow-brand-orange/30">
                    {step.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-xl text-white">
                      {step.title}
                    </h3>
                    <p className="font-body text-white/50 text-sm mt-0.5">
                      {step.short}
                    </p>
                  </div>
                  <motion.div
                    animate={{ 
                      rotate: active === i ? 45 : 0,
                      color: active === i ? '#E85D24' : 'rgba(255,255,255,0.3)'
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0 md:hidden"
                  >
                    <span className="text-lg leading-none">+</span>
                  </motion.div>
                </div>

                {/* Expandable content */}
                <AnimatePresence initial={false}>
                  {active === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
                        opacity: { duration: 0.3, delay: 0.1 }
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/10 pt-6">
                          {/* Photo */}
                          <motion.div
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.15 }}
                            className="relative rounded-xl overflow-hidden"
                            style={{ minHeight: '240px' }}
                          >
                            <Image
                              src={step.image}
                              alt={step.title}
                              fill
                              className="object-cover"
                            />
                            {/* Subtle gradient over photo */}
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 to-transparent" />
                          </motion.div>

                          {/* Text */}
                          <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="flex flex-col justify-center"
                          >
                            {step.detail.split('\n\n').map((para, j) => (
                              <p key={j} className="font-body text-white/70 text-sm leading-relaxed mb-4 last:mb-0">
                                {para}
                              </p>
                            ))}
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </div>
          ))}
        </div>

        {/* CTA */}
        <FadeIn delay={0.4}>
          <div className="text-center mt-16">
            <a
              href="/weight-explainer"
              className="inline-block bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-lg px-10 py-4 rounded-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-brand-orange/30"
            >
              Reserve Your Beef →
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
