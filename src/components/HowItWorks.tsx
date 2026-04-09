'use client';
import Image from 'next/image';
import { useState } from 'react';

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
  const [hovered, setHovered] = useState<number | null>(null);
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
    <section id="how-it-works" className="bg-brand-warm py-20 px-4">
      <div className="max-w-wide mx-auto">
        <h2 className="font-display font-bold text-4xl text-brand-dark text-center mb-4">
          How It Works
        </h2>
        <p className="font-body text-brand-gray text-center text-lg mb-16 max-w-xl mx-auto">
          From pasture to your freezer — here's exactly what to expect.
        </p>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div
              key={step.num}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-in-out ${
                hovered === i ? 'shadow-2xl scale-[1.02]' : 'shadow-md scale-100'
              }`}
              style={{ minHeight: hovered === i ? '480px' : '220px' }}
            >
              {/* Background image */}
              <div className="absolute inset-0">
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-cover"
                />
                <div
                  className={`absolute inset-0 transition-all duration-500 ${
                    hovered === i ? 'bg-brand-dark/80' : 'bg-brand-dark/50'
                  }`}
                />
              </div>

              {/* Content */}
              <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                {/* Number circle */}
                <div className="w-12 h-12 rounded-full bg-brand-orange text-white font-body font-bold flex items-center justify-center mb-4 text-lg">
                  {step.num}
                </div>

                <h3 className="font-display font-bold text-xl text-white mb-2">
                  {step.title}
                </h3>

                <p className="font-body text-white/80 text-sm mb-3">
                  {step.short}
                </p>

                {/* Expanded detail on hover */}
                <div
                  className={`overflow-hidden transition-all duration-500 ${
                    hovered === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="border-t border-white/20 pt-4 mt-1">
                    {step.detail.split('\n\n').map((para, j) => (
                      <p key={j} className="font-body text-white/70 text-sm leading-relaxed mb-3">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Hover hint */}
                {hovered !== i && (
                  <p className="font-body text-white/40 text-xs">
                    Hover to learn more →
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Calculator */}
        <div className="max-w-lg mx-auto mt-16 mb-8 bg-white rounded-2xl shadow-lg overflow-hidden">
          <button
            onClick={() => setShowCalc(!showCalc)}
            className="w-full px-8 py-5 flex items-center justify-between bg-brand-dark text-white font-display font-bold text-xl hover:bg-brand-dark/90 transition-colors"
          >
            <span>🧮 How much beef do I need?</span>
            <span className="text-brand-orange text-2xl">
              {showCalc ? '−' : '+'}
            </span>
          </button>

          {showCalc && (
            <div className="p-8">
              <p className="font-body text-brand-gray text-sm mb-6">
                Tell us about your household and we'll recommend the right size.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="font-body font-semibold text-brand-dark text-sm block mb-2">
                    Number of adults
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-10 h-10 rounded-full border-2 border-brand-gray-light font-bold text-brand-dark hover:border-brand-orange transition-colors"
                    >
                      −
                    </button>
                    <span className="font-display font-bold text-2xl text-brand-dark w-8 text-center">
                      {adults}
                    </span>
                    <button
                      onClick={() => setAdults(adults + 1)}
                      className="w-10 h-10 rounded-full border-2 border-brand-gray-light font-bold text-brand-dark hover:border-brand-orange transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-body font-semibold text-brand-dark text-sm block mb-2">
                    Number of kids
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setKids(Math.max(0, kids - 1))}
                      className="w-10 h-10 rounded-full border-2 border-brand-gray-light font-bold text-brand-dark hover:border-brand-orange transition-colors"
                    >
                      −
                    </button>
                    <span className="font-display font-bold text-2xl text-brand-dark w-8 text-center">
                      {kids}
                    </span>
                    <button
                      onClick={() => setKids(kids + 1)}
                      className="w-10 h-10 rounded-full border-2 border-brand-gray-light font-bold text-brand-dark hover:border-brand-orange transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-body font-semibold text-brand-dark text-sm block mb-2">
                    Beef meals per week
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setMealsPerWeek(Math.max(1, mealsPerWeek - 1))}
                      className="w-10 h-10 rounded-full border-2 border-brand-gray-light font-bold text-brand-dark hover:border-brand-orange transition-colors"
                    >
                      −
                    </button>
                    <span className="font-display font-bold text-2xl text-brand-dark w-8 text-center">
                      {mealsPerWeek}
                    </span>
                    <button
                      onClick={() => setMealsPerWeek(mealsPerWeek + 1)}
                      className="w-10 h-10 rounded-full border-2 border-brand-gray-light font-bold text-brand-dark hover:border-brand-orange transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Result */}
              <div className="mt-8 bg-brand-warm rounded-xl p-6 text-center">
                <p className="font-body text-brand-gray text-sm mb-1">
                  We recommend
                </p>
                <p className="font-display font-bold text-3xl text-brand-dark mb-1">
                  {rec.size}
                </p>
                <p className="font-body text-brand-orange font-semibold text-sm mb-2">
                  {rec.lbs} finished cuts
                </p>
                <p className="font-body text-brand-gray text-sm mb-6">
                  {rec.desc}
                </p>
                <a
                  href="/weight-explainer"
                  className="inline-block bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-semibold px-8 py-3 rounded-xl transition-colors"
                >
                  Reserve a {rec.size} →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <a
            href="/weight-explainer"
            className="inline-block bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-lg px-10 py-4 rounded-xl transition-colors"
          >
            Reserve Your Beef →
          </a>
        </div>
      </div>
    </section>
  );
}
