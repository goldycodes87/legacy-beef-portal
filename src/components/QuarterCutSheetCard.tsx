'use client';

import { useState } from 'react';
import HouseCutSheetModal from '@/components/HouseCutSheetModal';

export default function QuarterCutSheetCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="font-bold text-brand-dark text-base mb-1">Your Cut Sheet</h3>
        <p className="text-sm text-brand-gray mb-4 leading-relaxed">
          Your beef will be cut to our House Cut Sheet. No action needed from you.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-[#2D5016] text-[#2D5016] font-semibold text-sm hover:bg-green-50 transition-colors"
        >
          🥩 View House Cut Sheet
        </button>
      </div>

      <HouseCutSheetModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
