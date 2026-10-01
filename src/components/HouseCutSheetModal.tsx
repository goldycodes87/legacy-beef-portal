'use client';

// ─── House Cut Sheet Modal ────────────────────────────────────────────────────
// Displays a read-only summary of Legacy Land & Cattle's house cut sheet.
// Specs mirror HOUSE_DEFAULTS (cuts page + auto-lock cron). With the
// `quarter` prop it leads with what a typical quarter actually yields —
// counts and pounds — per Grant's numbers for a 1,250–1,300 lb animal.

interface HouseCutSheetModalProps {
  open: boolean;
  onClose: () => void;
  /** Show the typical-quarter quantities above the spec table. */
  quarter?: boolean;
}

import { QUARTER_YIELD, QUARTER_STATS } from '@/lib/quarter-yield';

const HOUSE_CUT_ROWS = [
  { cut: 'Chuck', spec: 'Steaks, 1″ thick, 1/pack' },
  { cut: 'Brisket', spec: 'Half brisket' },
  { cut: 'Skirt Steak', spec: 'Yes' },
  { cut: 'Rib', spec: 'Bone-in steaks, 1″ thick, 2/pack' },
  { cut: 'Short Ribs', spec: 'Yes' },
  { cut: 'Top Sirloin', spec: 'Steaks, ¾″ thick, 1/pack' },
  { cut: 'Round', spec: 'Grind' },
  { cut: 'Short Loin', spec: 'T-Bone, 1″ thick, 2/pack' },
  { cut: 'Flank', spec: 'Yes' },
  { cut: 'Stew Meat', spec: 'None — added to the grind' },
  { cut: 'Organs', spec: 'None' },
  { cut: 'Bones', spec: 'Soup bones' },
  { cut: 'Ground Beef', spec: '85/15, 1 lb packs' },
];

export default function HouseCutSheetModal({ open, onClose, quarter = false }: HouseCutSheetModalProps) {
  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg text-brand-dark leading-tight">
              {quarter ? 'Your Typical Quarter' : 'House Cut Sheet'}
            </h2>
            <p className="text-xs text-brand-gray mt-0.5">
              {quarter
                ? 'Legacy House Cut · ~1,250–1,300 lb animal'
                : 'Legacy Land & Cattle Standard Cuts'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {quarter ? (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  [QUARTER_STATS.boxed, 'boxed beef'],
                  [QUARTER_STATS.steaks, 'steaks'],
                  [QUARTER_STATS.freezer, 'freezer'],
                ].map(([v, label]) => (
                  <div key={label} className="bg-brand-warm rounded-xl text-center py-2.5">
                    <p className="font-bold text-brand-green text-base leading-tight">{v}</p>
                    <p className="text-[10px] uppercase tracking-wide text-brand-gray">{label}</p>
                  </div>
                ))}
              </div>
              <div>
                {QUARTER_YIELD.map((row) => (
                  <div
                    key={row.cut}
                    className="flex items-baseline justify-between gap-3 py-2 border-b border-gray-50 text-sm"
                  >
                    <span className="text-brand-dark font-medium">
                      {row.cut}
                      {row.spec && <span className="text-brand-gray font-normal text-xs"> · {row.spec}</span>}
                    </span>
                    <span className="text-brand-gray whitespace-nowrap tabular-nums">
                      {row.count} ({row.lbs})
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-brand-gray mt-4 leading-relaxed italic">
                Honest approximations — every animal is different. Your price is always actual
                hanging weight × your quoted price per pound.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-brand-gray mb-4 leading-relaxed">
                Quarter beef orders are processed using our house specifications below.
                You&apos;ll receive approximately one quarter of each cut.
              </p>

              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left font-semibold text-brand-dark pb-2 border-b-2 border-brand-orange/30 w-1/2">Cut</th>
                    <th className="text-left font-semibold text-brand-dark pb-2 border-b-2 border-brand-orange/30">Specification</th>
                  </tr>
                </thead>
                <tbody>
                  {HOUSE_CUT_ROWS.map((row, i) => (
                    <tr
                      key={row.cut}
                      className={i % 2 === 0 ? 'bg-white' : 'bg-brand-warm/50'}
                    >
                      <td className="py-2.5 pr-3 font-medium text-brand-dark border-b border-gray-50">{row.cut}</td>
                      <td className="py-2.5 text-brand-gray border-b border-gray-50">{row.spec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="text-xs text-brand-gray mt-4 leading-relaxed italic">
                Specifications are set by Legacy Land &amp; Cattle and applied uniformly to all quarter beef orders.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 flex-shrink-0 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-brand-dark text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-dark/90 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
