'use client';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FadeIn from '@/components/ui/FadeIn';

const steps = [
  {
    num: '1',
    title: 'Reserve Your Spot',
    icon: '🐄',
    image: '/images/20250406_133350.jpg',
    short: 'Choose your size and pay your deposit.',
    detail: `Pick a whole, half, or quarter beef — or split with friends to save. Not sure how much you need? Use our calculator below to find your perfect size.

Pay your deposit to lock in your spot and choose the butcher date that works best for you. Beef is dry-aged 21–24 days after butcher, so your estimated pickup is about 3–4 weeks out.

Price is all-inclusive — processing, transport to and from the butcher, everything. No surprises.`,
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
    detail: `Once your beef is ready, you'll get an email to schedule your pickup at 6105 Burgess Rd, Colorado Springs CO 80908.

Your beef arrives frozen solid, professionally packed in labeled boxes. A quarter is about 2 boxes, a half is about 4, and a whole is 8–10. Bring a cooler or we can help you load straight into your vehicle.

Pay your remaining balance at pickup — cash, check, or card accepted.`,
  },
];

export default function HowItWorks() {
  const [active, setActive] = useState<number | null>(null);
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(2);
  const [mealsPerWeek, setMealsPerWeek] = useState(3);
  const [showCalc, setShowCalc] = useState(false);

  function calcRecommendation() {
    const lbsPerWeek = (0.33 * kids + 0.5 * adults) * mealsPerWeek;
    const lbsPerYear = lbsPerWeek * 50;
    if (lbsPerYear < 50) return { size: 'Quarter Beef', lbs: '50–90 lbs', desc: 'Perfect for singles or couples who cook beef occasionally.' };
    if (lbsPerYear < 120) return { size: 'Quarter Beef', lbs: '50–90 lbs', desc: 'A quarter will keep you stocked for the year.' };
    if (lbsPerYear < 220) return { size: 'Half Beef', lbs: '190–235 lbs', desc: 'A half beef is your sweet spot.' };
    return { size: 'Whole Beef', lbs: '380–470 lbs', desc: 'A whole beef will keep your family fed all year.' };
  }
  const rec = calcRecommendation();

  return (
    <section id="how-it-works" className="bg-brand-dark py-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <FadeIn>
          <p className="font-body text-brand-orange text-sm font-semibold tracking-widest uppercase text-center mb-4">
            The Process
          </p>
          <h2 className="font-display font-black text-white text-center mb-4" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>
            From Pasture to Freezer
          </h2>
          <p className="font-body text-white/50 text-center text-lg mb-16 max-w-lg mx-auto">
            We handle everything. Here's exactly what happens after you reserve.
          </p>
        </FadeIn>

        {/* Step cards — vertical accordion */}
        <div className="space-y-3">
          {steps.map((step, i) => (
            <FadeIn key={step.num} delay={i * 0.1}>
              <motion.div
                layout
                onClick={() => setActive(active === i ? null : i)}
                className="relative overflow-hidden rounded-2xl cursor-pointer border border-white/10 hover:border-white/20 transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              >
                {/* Always-visible header row */}
                <div className="flex items-center gap-6 p-6">
                  <div className="w-12 h-12 rounded-full bg-brand-orange text-white font-display font-bold flex items-center justify-center text-lg flex-shrink-0">
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
                    animate={{ rotate: active === i ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0"
                  >
                    <span className="text-white/60 text-lg leading-none">+</span>
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
                        height: { duration: 0.5 },
                        opacity: { duration: 0.3, delay: 0.1 }
                      }}
                    >
                      <div className="px-6 pb-6">
                        <div className="grid md:grid-cols-2 gap-6 border-t border-white/10 pt-6">
                          {/* Photo */}
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="relative rounded-xl overflow-hidden"
                            style={{ minHeight: '240px' }}
                          >
                            <Image
                              src={step.image}
                              alt={step.title}
                              fill
                              className="object-cover"
                            />
                          </motion.div>

                          {/* Text */}
                          <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.25 }}
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
              </motion.div>
            </FadeIn>
          ))}
        </div>

        {/* Calculator */}
        <FadeIn delay={0.2}>
          <div className="max-w-lg mx-auto mt-16 mb-8 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            <button
              onClick={() => setShowCalc(!showCalc)}
              className="w-full px-8 py-5 flex items-center justify-between bg-white/5 hover:bg-white/10 text-white font-display font-bold text-xl transition-colors"
            >
              <span>🧮 How much beef do I need?</span>
              <span className="text-brand-orange text-2xl">
                {showCalc ? '−' : '+'}
              </span>
            </button>

            {showCalc && (
              <div className="p-8 border-t border-white/10">
                <p className="font-body text-white/70 text-sm mb-6">
                  Tell us about your household and we'll recommend the right size.
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="font-body font-semibold text-white text-sm block mb-2">
                      Number of adults
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        className="w-10 h-10 rounded-full border-2 border-white/20 font-bold text-white hover:border-brand-orange transition-colors"
                      >
                        −
                      </button>
                      <span className="font-display font-bold text-2xl text-white w-8 text-center">
                        {adults}
                      </span>
                      <button
                        onClick={() => setAdults(adults + 1)}
                        className="w-10 h-10 rounded-full border-2 border-white/20 font-bold text-white hover:border-brand-orange transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-body font-semibold text-white text-sm block mb-2">
                      Number of kids
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setKids(Math.max(0, kids - 1))}
                        className="w-10 h-10 rounded-full border-2 border-white/20 font-bold text-white hover:border-brand-orange transition-colors"
                      >
                        −
                      </button>
                      <span className="font-display font-bold text-2xl text-white w-8 text-center">
                        {kids}
                      </span>
                      <button
                        onClick={() => setKids(kids + 1)}
                        className="w-10 h-10 rounded-full border-2 border-white/20 font-bold text-white hover:border-brand-orange transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-body font-semibold text-white text-sm block mb-2">
                      Beef meals per week
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setMealsPerWeek(Math.max(1, mealsPerWeek - 1))}
                        className="w-10 h-10 rounded-full border-2 border-white/20 font-bold text-white hover:border-brand-orange transition-colors"
                      >
                        −
                      </button>
                      <span className="font-display font-bold text-2xl text-white w-8 text-center">
                        {mealsPerWeek}
                      </span>
                      <button
                        onClick={() => setMealsPerWeek(mealsPerWeek + 1)}
                        className="w-10 h-10 rounded-full border-2 border-white/20 font-bold text-white hover:border-brand-orange transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Result */}
                <div className="mt-8 bg-white/5 rounded-xl p-6 text-center border border-white/10">
                  <p className="font-body text-white/50 text-sm mb-1">
                    We recommend
                  </p>
                  <p className="font-display font-bold text-3xl text-white mb-1">
                    {rec.size}
                  </p>
                  <p className="font-body text-brand-orange font-semibold text-sm mb-2">
                    {rec.lbs} finished cuts
                  </p>
                  <p className="font-body text-white/70 text-sm mb-6">
                    {rec.desc}
                  </p>
                  <a
                    href="/weight-explainer"
                    className="inline-block bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-semibold px-8 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Reserve a {rec.size} →
                  </a>
                </div>
              </div>
            )}
          </div>
        </FadeIn>

        {/* CTA */}
        {!showCalc && (
          <FadeIn delay={0.3}>
            <div className="text-center mt-12">
              <a
                href="/weight-explainer"
                className="inline-block bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-lg px-10 py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Reserve Your Beef →
              </a>
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  );
}
