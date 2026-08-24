'use client';

import { useState } from 'react';

// The stage labels wrap to two lines on a phone, which left the second line
// almost touching the number underneath. Tight leading on the label plus a real
// gap below it keeps the two readable as separate things at any width.
const STAGE_LABEL =
  'text-[11px] sm:text-xs font-semibold uppercase tracking-wide leading-[1.15] mb-2.5';
const STAGE_NUMBER = 'text-3xl font-bold leading-none';

interface WeightExplainerProps {
  /** Price per lb by size, from the config table. */
  prices?: { whole: number; half: number; quarter: number };
}

export default function WeightExplainer({
  prices = { whole: 8.0, half: 8.25, quarter: 8.5 },
}: WeightExplainerProps) {
  const [liveWeight, setLiveWeight] = useState(1200);

  const hangingWeight = Math.round(liveWeight * 0.60);
  const finishedCuts = Math.round(hangingWeight * 0.52);

  // Prices are charged on hanging weight.
  // Range reflects ±5% natural variation in hanging weight yield.
  const wholeLow = Math.round(hangingWeight * 0.95 * prices.whole);
  const wholeHigh = Math.round(hangingWeight * 1.05 * prices.whole);

  // Half beef is half the animal, quarter is a quarter.
  const halfLow = Math.round((hangingWeight / 2) * 0.95 * prices.half);
  const halfHigh = Math.round((hangingWeight / 2) * 1.05 * prices.half);

  const quarterLow = Math.round((hangingWeight / 4) * 0.95 * prices.quarter);
  const quarterHigh = Math.round((hangingWeight / 4) * 1.05 * prices.quarter);

  return (
    <div className="w-full">
      {/* Three-stage visual */}
      <div className="flex items-center justify-between gap-2 mb-8">
        {/* Live Weight */}
        <div className="flex-1 bg-brand-gray-light rounded-xl p-4 text-center">
          <div className={STAGE_LABEL + ' text-brand-gray'}>Live Weight</div>
          <div
            className={STAGE_NUMBER + ' text-brand-dark'}
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {liveWeight}
          </div>
          <div className="text-sm text-brand-gray mt-0.5">lbs</div>
        </div>

        {/* Arrow 1 */}
        <div className="flex flex-col items-center flex-shrink-0">
          <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 12H28M28 12L18 4M28 12L18 20" stroke="#E85D24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[10px] text-brand-orange font-semibold mt-1">60%</span>
        </div>

        {/* Hanging Weight */}
        <div className="flex-1 bg-[#F0F7F3] border border-brand-green rounded-xl p-4 text-center">
          <div className={STAGE_LABEL + ' text-brand-green'}>Hanging Wt.</div>
          <div
            className={STAGE_NUMBER + ' text-brand-green'}
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {hangingWeight}
          </div>
          <div className="text-sm text-brand-green opacity-75 mt-0.5">lbs</div>
        </div>

        {/* Arrow 2 */}
        <div className="flex flex-col items-center flex-shrink-0">
          <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 12H28M28 12L18 4M28 12L18 20" stroke="#E85D24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[10px] text-brand-orange font-semibold mt-1">52%</span>
        </div>

        {/* Finished Cuts */}
        <div className="flex-1 bg-brand-dark rounded-xl p-4 text-center">
          <div className={STAGE_LABEL + ' text-white opacity-60'}>Finished Cuts</div>
          <div
            className={STAGE_NUMBER + ' text-white'}
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {finishedCuts}
          </div>
          <div className="text-sm text-white opacity-60 mt-0.5">lbs</div>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-6">
        <label
          htmlFor="liveWeightSlider"
          className="block text-sm font-semibold text-brand-dark mb-3"
        >
          Adjust Live Weight: <span className="text-brand-orange">{liveWeight} lbs</span>
        </label>
        <input
          id="liveWeightSlider"
          type="range"
          min={1000}
          max={1500}
          step={10}
          value={liveWeight}
          onChange={(e) => setLiveWeight(Number(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #E85D24 0%, #E85D24 ${((liveWeight - 1000) / 500) * 100}%, #E5E7EB ${((liveWeight - 1000) / 500) * 100}%, #E5E7EB 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-brand-gray mt-1">
          <span>1,000 lbs</span>
          <span>1,500 lbs</span>
        </div>
      </div>

      {/* Estimated costs by size */}
      <div className="bg-[#FFF5F0] border border-brand-orange rounded-xl p-4 mb-8">
        <div className="text-sm font-semibold text-brand-dark mb-3 text-center">
          Estimated cost by size (based on {liveWeight} lb live animal)
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-brand-dark">Whole Beef</span>
            <span
              className="text-lg font-bold text-brand-orange"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Est. ${wholeLow.toLocaleString()}–${wholeHigh.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-brand-dark">Half Beef</span>
            <span
              className="text-lg font-bold text-brand-orange"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Est. ${halfLow.toLocaleString()}–${halfHigh.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-brand-dark">Quarter Beef</span>
            <span
              className="text-lg font-bold text-brand-orange"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Est. ${quarterLow.toLocaleString()}–${quarterHigh.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-brand-gray-light rounded-xl p-4 text-center">
          <div
            className="text-2xl font-bold text-brand-green"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            60%
          </div>
          <div className="text-xs text-brand-gray mt-1 leading-tight">Live to hanging yield</div>
        </div>
        <div className="bg-white border border-brand-gray-light rounded-xl p-4 text-center">
          <div
            className="text-2xl font-bold text-brand-green"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            52%
          </div>
          <div className="text-xs text-brand-gray mt-1 leading-tight">After butchering, trimming, and 21-24 days of dry aging</div>
        </div>

      </div>
    </div>
  );
}
