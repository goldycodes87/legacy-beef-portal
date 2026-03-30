'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

type SizeOption = 'whole' | 'half' | 'quarter';
type SplitChoice = 'no' | 'yes';
type CutSheetChoice = 'separate' | 'shared';

interface Inventory {
  whole_available: number;
  half_available: number;
  quarter_available: number;
}

// ─── Toast component ─────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="alert"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg
                 text-sm font-medium max-w-xs text-center
                 animate-[slideUp_0.25s_ease-out]"
    >
      {message}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SelectSizePage() {
  const router = useRouter();

  // Inventory
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  // Selection state
  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null);
  const [splitChoice, setSplitChoice] = useState<SplitChoice | null>(null);
  const [groupSize, setGroupSize] = useState<number>(2);
  const [cutSheet, setCutSheet] = useState<CutSheetChoice>('shared');
  const [partnerEmail, setPartnerEmail] = useState<string>('');

  // UI state
  const [splitVisible, setSplitVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Ref for smooth scroll-into-view after split question appears
  const splitRef = useRef<HTMLDivElement>(null);

  // ── Fetch inventory on mount ─────────────────────────────────────────────
  useEffect(() => {
    const animalType =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('animalTypePreference') ?? 'no_preference'
        : 'no_preference';

    fetch(`/api/inventory?animalType=${encodeURIComponent(animalType)}`)
      .then((r) => r.json())
      .then((data: Inventory) => {
        setInventory(data);
        setInventoryLoading(false);
      })
      .catch(() => {
        // Safe fallback so page still works
        setInventory({ whole_available: 5, half_available: 10, quarter_available: 8 });
        setInventoryLoading(false);
      });
  }, []);

  // ── When size changes, reset split state and animate in question ──────────
  function handleSelectSize(size: SizeOption) {
    // Don't allow selecting sold-out cards
    if (inventory && getAvailable(size) === 0) return;

    setSelectedSize(size);
    setSplitChoice(null);
    setPartnerEmail('');
    setGroupSize(2);
    setCutSheet('shared');

    // Show split question with a tiny delay for animation
    setSplitVisible(false);
    setTimeout(() => {
      setSplitVisible(true);
      setTimeout(() => {
        splitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }, 50);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  function getAvailable(size: SizeOption): number {
    if (!inventory) return 99; // optimistic while loading
    const map: Record<SizeOption, number> = {
      whole: inventory.whole_available,
      half: inventory.half_available,
      quarter: inventory.quarter_available,
    };
    return Math.max(0, map[size]);
  }

  function isSoldOut(size: SizeOption): boolean {
    return !inventoryLoading && getAvailable(size) === 0;
  }

  function showSpotsRemaining(size: SizeOption): boolean {
    const n = getAvailable(size);
    return !inventoryLoading && n > 0 && n <= 3;
  }

  // ── CTA disabled logic ───────────────────────────────────────────────────
  const ctaDisabled: boolean = (() => {
    if (!selectedSize) return true;
    if (splitChoice === null) return true;
    if (splitChoice === 'yes') {
      if (selectedSize === 'quarter') return false; // quarter: no email needed
      if (!partnerEmail.trim() || !partnerEmail.includes('@')) return true;
    }
    return false;
  })();

  // ── Reserve handler ──────────────────────────────────────────────────────
  async function handleReserve() {
    if (!selectedSize || ctaDisabled) return;
    setSubmitting(true);

    // Re-check inventory
    const animalType = sessionStorage.getItem('animalTypePreference') ?? 'no_preference';
    let freshInventory: Inventory;
    try {
      const res = await fetch(`/api/inventory?animalType=${encodeURIComponent(animalType)}`);
      freshInventory = await res.json();
    } catch {
      freshInventory = { whole_available: 99, half_available: 99, quarter_available: 99 };
    }

    const stillAvailable = Math.max(0, {
      whole: freshInventory.whole_available,
      half: freshInventory.half_available,
      quarter: freshInventory.quarter_available,
    }[selectedSize]);

    if (stillAvailable === 0) {
      setToast('This size is now sold out. Please choose another.');
      setSubmitting(false);
      return;
    }

    // Build data to persist
    const isSplitting = splitChoice === 'yes' && selectedSize !== 'quarter';
    const emails: string[] = isSplitting && partnerEmail.trim() ? [partnerEmail.trim()] : [];

    sessionStorage.setItem('selectedSize', selectedSize);
    sessionStorage.setItem('isSplitting', String(isSplitting));
    sessionStorage.setItem('partnerEmails', JSON.stringify(emails));
    sessionStorage.setItem('groupSize', String(isSplitting ? groupSize : 1));
    if (selectedSize === 'whole') {
      sessionStorage.setItem('cutSheetChoice', cutSheet);
    }
    if (isSplitting) {
      const groupId = crypto.randomUUID();
      sessionStorage.setItem('group_id', groupId);
    }

    router.push('/select-animal');
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-brand-dark px-4 py-4 flex items-center">
        <Image
          src="/images/LLC_Logo.svg"
          alt="Legacy Land & Cattle"
          width={140}
          height={60}
          className="h-10 w-auto object-contain"
        />
      </header>

      <main className="max-w-[680px] mx-auto px-4 py-10">
        {/* Heading */}
        <h1
          className="text-3xl md:text-4xl font-bold text-brand-dark mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Choose Your Beef
        </h1>
        <p className="text-brand-gray mb-8 text-base">
          Select how much beef you&apos;d like to reserve. All prices are based on hanging weight.
        </p>

        {/* Cards */}
        {inventoryLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 mb-8">
            {/* ── Whole Beef ── */}
            <SizeCard
              id="whole"
              badge="Best Value"
              badgeColor="bg-brand-green text-white"
              title="Whole Beef"
              price="$8.00/lb"
              deposit="$850 deposit (or $500 each if splitting)"
              yieldRange="Est. $5,200–$6,200 total | ~390–465 lbs finished cuts"
              soldOut={isSoldOut('whole')}
              spotsRemaining={showSpotsRemaining('whole') ? getAvailable('whole') : null}
              selected={selectedSize === 'whole'}
              onSelect={() => handleSelectSize('whole')}
            />

            {/* ── Half Beef ── */}
            <SizeCard
              id="half"
              badge="Most Popular"
              badgeColor="bg-brand-orange text-white"
              title="Half Beef"
              price="$8.25/lb"
              deposit="$500 deposit"
              yieldRange="Est. $2,700–$3,200 total | ~195–235 lbs finished cuts"
              soldOut={isSoldOut('half')}
              spotsRemaining={showSpotsRemaining('half') ? getAvailable('half') : null}
              selected={selectedSize === 'half'}
              onSelect={() => handleSelectSize('half')}
            />

            {/* ── Quarter Beef ── */}
            <SizeCard
              id="quarter"
              title="Quarter Beef"
              price="$8.50/lb"
              deposit="$250 deposit"
              yieldRange="Est. $1,400–$1,650 total | ~98–118 lbs finished cuts"
              note="Uses Legacy's house cut sheet"
              soldOut={isSoldOut('quarter')}
              spotsRemaining={showSpotsRemaining('quarter') ? getAvailable('quarter') : null}
              selected={selectedSize === 'quarter'}
              onSelect={() => handleSelectSize('quarter')}
            />
          </div>
        )}

        {/* ── Split Question (animates in) ── */}
        <div
          ref={splitRef}
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            splitVisible ? 'max-h-[600px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'
          }`}
          style={{ transform: splitVisible ? 'translateY(0)' : 'translateY(-8px)' }}
        >
          {selectedSize && (
            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-6 mb-6">
              <h2
                className="text-lg font-bold text-brand-dark mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Are you splitting with someone?
              </h2>

              {/* Quarter → no split allowed */}
              {selectedSize === 'quarter' ? (
                <>
                  <div className="flex gap-3 mb-4">
                    <SplitButton
                      label="No, just me"
                      active={splitChoice === 'no'}
                      onClick={() => setSplitChoice('no')}
                    />
                    {/* Disabled "yes" for quarter */}
                    <button
                      disabled
                      className="flex-1 py-3 rounded-xl border-2 border-[#E5E7EB] text-[#9CA3AF] text-sm font-semibold cursor-not-allowed bg-white"
                    >
                      Yes, splitting with someone
                    </button>
                  </div>
                  <div className="bg-[#FFF5F0] border border-brand-orange/30 rounded-xl px-4 py-3 text-sm text-brand-gray">
                    <span className="font-semibold text-brand-dark">Quarter beef is individual.</span>{' '}
                    Contact us for group purchases.
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-3 mb-4">
                    <SplitButton
                      label="No, just me"
                      active={splitChoice === 'no'}
                      onClick={() => setSplitChoice('no')}
                    />
                    <SplitButton
                      label="Yes, splitting with someone"
                      active={splitChoice === 'yes'}
                      onClick={() => setSplitChoice('yes')}
                    />
                  </div>
                </>
              )}

              {/* ── Whole Beef + Splitting ── */}
              {selectedSize === 'whole' && splitChoice === 'yes' && (
                <div className="space-y-4 mt-2">
                  {/* How many people */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1">
                      How many people are splitting?
                    </label>
                    <select
                      value={groupSize}
                      onChange={(e) => setGroupSize(Number(e.target.value))}
                      className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    >
                      {[2, 3, 4].map((n) => (
                        <option key={n} value={n}>{n} people</option>
                      ))}
                    </select>
                  </div>

                  {/* Cut sheet choice */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1">
                      Cut sheet preference
                    </label>
                    <div className="flex gap-3">
                      {(['shared', 'separate'] as CutSheetChoice[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setCutSheet(opt)}
                          className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors duration-150
                            ${cutSheet === opt
                              ? 'border-brand-orange bg-[#FFF5F0] text-brand-dark'
                              : 'border-[#E5E7EB] text-brand-gray hover:border-brand-orange/50'
                            }`}
                        >
                          {opt === 'shared' ? 'Shared cut sheet' : 'Separate cut sheets'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Partner email */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1">
                      Partner&apos;s email address
                    </label>
                    <input
                      type="email"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      placeholder="partner@example.com"
                      className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>

                  {/* Disclosure */}
                  <div className="bg-[#FFF5F0] border border-brand-orange/30 rounded-xl px-4 py-3 text-sm text-brand-gray leading-relaxed">
                    <span className="font-semibold text-brand-dark">Each pays $500 deposit.</span>{' '}
                    Both pay within 48 hrs → $8.00/lb for both{' '}
                    <span className="text-brand-green font-semibold">(~$90 savings each)</span>.
                  </div>
                </div>
              )}

              {/* ── Half Beef + Splitting ── */}
              {selectedSize === 'half' && splitChoice === 'yes' && (
                <div className="space-y-4 mt-2">
                  {/* Partner email */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1">
                      Partner&apos;s email address
                    </label>
                    <input
                      type="email"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      placeholder="partner@example.com"
                      className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>

                  {/* Disclosure */}
                  <div className="bg-[#FFF5F0] border border-brand-orange/30 rounded-xl px-4 py-3 text-sm text-brand-gray">
                    <span className="font-semibold text-brand-dark">Each pays $500 deposit at $8.25/lb.</span>{' '}
                    Cut sheet is shared between both parties.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── CTA Button ── */}
        <button
          onClick={handleReserve}
          disabled={ctaDisabled || submitting}
          className={`
            w-full min-h-[48px] rounded-xl font-semibold text-base transition-colors duration-150
            ${!ctaDisabled && !submitting
              ? 'bg-brand-orange hover:bg-brand-orange-hover text-white cursor-pointer'
              : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
            }
          `}
        >
          {submitting ? 'Checking availability…' : 'Reserve My Slot →'}
        </button>
      </main>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Keyframe for toast animation */}
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SizeCardProps {
  id: SizeOption;
  badge?: string;
  badgeColor?: string;
  title: string;
  price: string;
  deposit: string;
  yieldRange: string;
  note?: string;
  soldOut: boolean;
  spotsRemaining: number | null;
  selected: boolean;
  onSelect: () => void;
}

function SizeCard({
  badge,
  badgeColor,
  title,
  price,
  deposit,
  yieldRange,
  note,
  soldOut,
  spotsRemaining,
  selected,
  onSelect,
}: SizeCardProps) {
  return (
    <button
      onClick={onSelect}
      disabled={soldOut}
      aria-pressed={selected}
      className={`
        relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2
        ${soldOut
          ? 'border-[#E5E7EB] bg-[#F9FAFB] opacity-60 cursor-not-allowed'
          : selected
          ? 'border-brand-orange bg-[#FFF5F0]'
          : 'border-[#E5E7EB] bg-white hover:border-brand-orange/50 hover:shadow-sm cursor-pointer'
        }
      `}
    >
      {/* Top row: badge + sold-out badge */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {badge && !soldOut && (
          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
        {soldOut && (
          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#6B7280] text-white">
            Sold Out
          </span>
        )}
        {spotsRemaining !== null && !soldOut && (
          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
            {spotsRemaining} spot{spotsRemaining !== 1 ? 's' : ''} remaining
          </span>
        )}
      </div>

      {/* Title + price row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3
            className={`text-lg font-bold mb-0.5 ${soldOut ? 'text-[#9CA3AF]' : 'text-brand-dark'}`}
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {title}
          </h3>
          <p className={`text-sm mb-1 ${soldOut ? 'text-[#9CA3AF]' : 'text-brand-gray'}`}>
            {deposit}
          </p>
          <p className={`text-xs leading-relaxed ${soldOut ? 'text-[#9CA3AF]' : 'text-brand-gray'}`}>
            {yieldRange}
          </p>
          {note && (
            <p className={`text-xs mt-1 italic ${soldOut ? 'text-[#9CA3AF]' : 'text-brand-gray'}`}>
              {note}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="shrink-0 text-right">
          <p className={`text-xl font-bold ${soldOut ? 'text-[#9CA3AF]' : 'text-brand-dark'}`}>
            {price}
          </p>
          {selected && !soldOut && (
            <div className="mt-1 flex justify-end">
              <div className="w-5 h-5 rounded-full bg-brand-orange flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function SplitButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-colors duration-150
        ${active
          ? 'border-brand-orange bg-[#FFF5F0] text-brand-dark'
          : 'border-[#E5E7EB] text-brand-gray hover:border-brand-orange/50'
        }
      `}
    >
      {label}
    </button>
  );
}
