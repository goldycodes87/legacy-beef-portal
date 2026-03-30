'use client';

import { useState } from 'react';

export default function WeightExplainer() {
  const [liveWeight, setLiveWeight] = useState(1200);

  const hangingWeight = Math.round(liveWeight * 0.60);
  const finishedCuts = Math.round(hangingWeight * 0.52);

  // Prices are charged on hanging weight
  // Range reflects ±5% natural variation in hanging weight yield
  // Whole Beef: $8.00/lb hanging weight
  const wholeLow = Math.round(hangingWeight * 0.95 * 8.00);
  const wholeHigh = Math.round(hangingWeight * 1.05 * 8.00);

  // Half Beef: $8.25/lb hanging weight (half the animal)
  const halfLow = Math.round((hangingWeight / 2) * 0.95 * 8.25);
  const halfHigh = Math.round((hangingWeight / 2) * 1.05 * 8.25);

  // Quarter Beef: $8.50/lb hanging weight (quarter of the animal)
  const quarterLow = Math.round((hangingWeight / 4) * 0.95 * 8.50);
  const quarterHigh = Math.round((hangingWeight / 4) * 1.05 * 8.50);

  return (
    <div className="w-full">
      {/* Three-stage visual */}
      <div className="flex items-center justify-between gap-2 mb-8">
        {/* Live Weight */}
        <div className="flex-1 bg-brand-gray-light rounded-xl p-4 text-center">
          <div className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-1">Live Weight</div>
          <div
            className="text-3xl font-bold text-brand-dark"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {liveWeight}
          </div>
          <div className="text-sm text-brand-gray">lbs</div>
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
          <div className="text-xs font-semibold text-brand-green uppercase tracking-wider mb-1">Hanging Wt.</div>
          <div
            className="text-3xl font-bold text-brand-green"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {hangingWeight}
          </div>
          <div className="text-sm text-brand-green opacity-75">lbs</div>
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
          <div className="text-xs font-semibold text-white opacity-60 uppercase tracking-wider mb-1">Finished Cuts</div>
          <div
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {finishedCuts}
          </div>
          <div className="text-sm text-white opacity-60">lbs</div>
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
        <div className="bg-white border border-brand-gray-light rounded-xl p-4 text-center">
          <div
            className="text-2xl font-bold text-brand-green"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            ~400
          </div>
          <div className="text-xs text-brand-gray mt-1 leading-tight">average finished cuts per whole beef</div>
        </div>
      </div>
    </div>
  );
}
