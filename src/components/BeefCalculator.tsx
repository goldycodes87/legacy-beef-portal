'use client';

import { useState } from 'react';

export default function BeefCalculator() {
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
    <div className="max-w-lg mx-auto rounded-2xl shadow-lg overflow-hidden border border-white/10 bg-white/5">
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
  );
}
