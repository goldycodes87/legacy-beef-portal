'use client';

// ─── House Cut Sheet Modal ────────────────────────────────────────────────────
// Displays a read-only summary of Legacy Land & Cattle's house cut sheet.
// Values mirror HOUSE_DEFAULTS in src/app/session/[uuid]/cuts/page.tsx

interface HouseCutSheetModalProps {
  open: boolean;
  onClose: () => void;
}

const HOUSE_CUT_ROWS = [
  { cut: 'Chuck',            spec: 'Steaks, 1″ thick, 2/pack' },
  { cut: 'Brisket',         spec: 'Half brisket' },
  { cut: 'Skirt Steak',     spec: 'Yes' },
  { cut: 'Rib',             spec: 'Bone-in steaks, 1″ thick, 2/pack' },
  { cut: 'Short Ribs',      spec: 'Yes' },
  { cut: 'Sirloin',         spec: 'Steaks, 1″ thick, 2/pack' },
  { cut: 'Round',           spec: 'Grind' },
  { cut: 'Short Loin',      spec: 'T-Bone, 1″ thick, 2/pack' },
  { cut: 'Flank',           spec: 'Yes' },
  { cut: 'Stew Meat',       spec: '1 lb packs' },
  { cut: 'Tenderized Round',spec: 'N/A' },
  { cut: 'Organs',          spec: 'None' },
  { cut: 'Bones',           spec: 'Soup' },
  { cut: 'Ground Beef',     spec: '85/15, 1 lb packs' },
];

export default function HouseCutSheetModal({ open, onClose }: HouseCutSheetModalProps) {
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
            <h2 className="font-bold text-lg text-brand-dark leading-tight">House Cut Sheet</h2>
            <p className="text-xs text-brand-gray mt-0.5">Legacy Land &amp; Cattle Standard Cuts</p>
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
