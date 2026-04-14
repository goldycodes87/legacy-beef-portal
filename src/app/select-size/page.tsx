'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReservationProgress from '@/components/ReservationProgress';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';

// ─── Types ────────────────────────────────────────────────────────────────────

type SizeOption = 'whole' | 'half' | 'quarter' | 'wagyu';
type SplitChoice = 'no' | 'yes';
type CutSheetChoice = 'separate' | 'shared' | 'master' | 'none';

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
  const [partnerEmails4, setPartnerEmails4] = useState(['', '', '']);

  // UI state
  const [splitVisible, setSplitVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Wagyu state
  const [wagyuActive, setWagyuActive] = useState(false);
  const [wagyuNotifyOpen, setWagyuNotifyOpen] = useState(false);
  const [wagyuForm, setWagyuForm] = useState({ name: '', email: '', size: 'half' });
  const [wagyuSubmitting, setWagyuSubmitting] = useState(false);
  const [wagyuSubmitted, setWagyuSubmitted] = useState(false);

  // Ref for smooth scroll-into-view after split question appears
  const splitRef = useRef<HTMLDivElement>(null);

  // ── Fetch inventory on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') sessionStorage.removeItem('animalTypePreference');
    fetch(`/api/inventory?animalType=no_preference`)
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

    // Check wagyu availability
    try {
      fetch('/api/slots?animalType=wagyu&purchaseType=half')
        .then((wagyuRes) => wagyuRes.json())
        .then((wagyuData) => {
          setWagyuActive((wagyuData.slots || []).length > 0);
        })
        .catch(() => {
          setWagyuActive(false);
        });
    } catch {
      setWagyuActive(false);
    }
  }, []);

  // ── When size changes, reset split state and animate in question ──────────
  function handleSelectSize(size: SizeOption) {
    // Don't allow selecting sold-out cards
    if (inventory && getAvailable(size) === 0) return;

    setSelectedSize(size);
    setSplitChoice(null);
    if (size === 'quarter') setSplitChoice('no');
    setPartnerEmail('');
    setPartnerEmails4(['', '', '']);
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
    if (size === 'wagyu') return 99; // wagyu handled separately via wagyuActive
    const map: Record<Exclude<SizeOption, 'wagyu'>, number> = {
      whole: inventory.whole_available,
      half: inventory.half_available,
      quarter: inventory.quarter_available,
    };
    return Math.max(0, map[size]);
  }

  function isSoldOut(size: SizeOption): boolean {
    return !inventoryLoading && getAvailable(size) === 0;
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

  // ── Wagyu notify handler ─────────────────────────────────────────────────
  const handleWagyuNotify = async () => {
    if (!wagyuForm.name || !wagyuForm.email) return;
    setWagyuSubmitting(true);
    const res = await fetch('/api/wagyu-waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: wagyuForm.name,
        email: wagyuForm.email,
        size_preference: wagyuForm.size,
      }),
    });
    if (res.ok) setWagyuSubmitted(true);
    setWagyuSubmitting(false);
  };

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

    // Skip inventory check for wagyu (handled separately)
    if (selectedSize !== 'wagyu') {
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
    }

    // Build data to persist
    const isSplitting = splitChoice === 'yes' && selectedSize !== 'quarter';
    let emails: string[];
    if (isSplitting && selectedSize === 'whole' && groupSize === 4) {
      emails = partnerEmails4.filter(e => e.trim());
    } else if (isSplitting && partnerEmail.trim()) {
      emails = [partnerEmail.trim()];
    } else {
      emails = [];
    }

    sessionStorage.setItem('selectedSize', selectedSize);
    sessionStorage.setItem('isSplitting', String(isSplitting));
    sessionStorage.setItem('partnerEmails', JSON.stringify(emails));
    sessionStorage.setItem('groupSize', String(isSplitting ? groupSize : 1));
    // cutSheetChoice: for half splits use the user-selected cutSheet value
    const cutSheetDerived = selectedSize === 'whole' && groupSize === 4 ? 'shared' :
      selectedSize === 'whole' && groupSize === 2 ? 'separate' :
      selectedSize === 'half' && isSplitting ? cutSheet : 'none';
    sessionStorage.setItem('cutSheetChoice', cutSheetDerived);
    if (isSplitting) {
      const groupId = crypto.randomUUID();
      sessionStorage.setItem('group_id', groupId);
    }

    router.push('/select-animal');
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-brand-warm">
      <PageHeader showBack={true} currentStep={2} totalSteps={6} />

      <ReservationProgress currentStep="choose" />

      <main className="max-w-[680px] mx-auto px-4 py-10">
        {/* Heading */}
        <h1 className="font-display font-bold text-3xl md:text-4xl text-brand-dark mb-3">
          Choose Your Beef
        </h1>
        <p className="font-body text-brand-gray mb-8 text-base">
          Select how much beef you&apos;d like to reserve. All prices are based on hanging weight.
        </p>

        {/* Cards */}
        {inventoryLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              selected={selectedSize === 'quarter'}
              onSelect={() => handleSelectSize('quarter')}
            />

            {/* ── American Wagyu Card ── */}
            {wagyuActive ? (
              <SizeCard
                id="wagyu"
                badge="Premium"
                badgeColor="bg-purple-600 text-white"
                title="American Wagyu"
                price="$9.50–$10.00/lb"
                deposit="$850/$500/$250 deposit"
                yieldRange="Same yield as standard beef — extraordinary marbling"
                note="Limited availability — reservation only"
                soldOut={false}
                selected={selectedSize === 'wagyu'}
                onSelect={() => {
                  setSelectedSize('wagyu' as any);
                  setSplitChoice(null);
                }}
              />
            ) : (
              <div className="relative w-full rounded-2xl overflow-hidden shadow-md">
                {/* Dark header */}
                <div className="bg-gradient-to-br from-purple-900 to-brand-dark p-5">
                  <span className="inline-block text-xs font-body font-semibold px-2.5 py-0.5 rounded-full bg-purple-500 text-white mb-2">
                    Coming Soon
                  </span>
                  <h3 className="font-display font-bold text-xl text-white">
                    American Wagyu
                  </h3>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="font-display font-black text-3xl text-white">
                      $9.50+
                    </span>
                    <span className="font-body text-white/60 text-sm pb-1">
                      /lb hanging weight
                    </span>
                  </div>
                </div>

                {/* White body */}
                <div className="bg-white p-5 border-x border-b border-gray-100 rounded-b-2xl">
                  <p className="font-body text-brand-gray text-sm mb-4 leading-relaxed">
                    Our American Wagyu (50% Japanese Wagyu × Black Angus) delivers extraordinary marbling and buttery flavor. Limited slots — get notified when one opens up.
                  </p>

                  {!wagyuSubmitted ? (
                    <>
                      {!wagyuNotifyOpen ? (
                        <button
                          onClick={() => setWagyuNotifyOpen(true)}
                          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-body font-semibold text-sm transition-colors"
                        >
                          Notify Me When Available →
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Your name"
                            value={wagyuForm.name}
                            onChange={(e) => setWagyuForm({ ...wagyuForm, name: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-brand-dark focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <input
                            type="email"
                            placeholder="Your email"
                            value={wagyuForm.email}
                            onChange={(e) => setWagyuForm({ ...wagyuForm, email: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-brand-dark focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <select
                            value={wagyuForm.size}
                            onChange={(e) => setWagyuForm({ ...wagyuForm, size: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-brand-dark focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="whole">Whole ($850 deposit)</option>
                            <option value="half">Half ($500 deposit)</option>
                            <option value="quarter">Quarter ($250 deposit)</option>
                          </select>
                          <button
                            onClick={handleWagyuNotify}
                            disabled={wagyuSubmitting || !wagyuForm.name || !wagyuForm.email}
                            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-body font-semibold text-sm transition-colors"
                          >
                            {wagyuSubmitting ? 'Saving...' : 'Notify Me →'}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-3">
                      <p className="font-body font-semibold text-purple-600 text-sm">
                        ✓ You're on the list! We'll email you when Wagyu is available.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
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
          {selectedSize && selectedSize !== 'quarter' && (
            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-6 mb-6">
              <h2 className="font-display font-bold text-lg text-brand-dark mb-4">
                Are you splitting with someone?
              </h2>

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
                      {[2, 4].map((n) => (
                        <option key={n} value={n}>{n === 2 ? '2 people (2 Halves)' : '4 people (4 Quarters)'}</option>
                      ))}
                    </select>
                  </div>

                  {/* Partner email(s) */}
                  {groupSize === 4 ? (
                    [0, 1, 2].map(i => (
                      <div key={i}>
                        <label className="block text-sm font-semibold text-brand-dark mb-1">
                          Partner {i + 1} email address
                        </label>
                        <input
                          type="email"
                          value={partnerEmails4[i]}
                          onChange={(e) => {
                            const updated = [...partnerEmails4];
                            updated[i] = e.target.value;
                            setPartnerEmails4(updated);
                          }}
                          placeholder={`partner${i + 1}@example.com`}
                          className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange"
                        />
                      </div>
                    ))
                  ) : (
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
                  )}

                  {/* Disclosure */}
                  <div className="bg-[#FFF5F0] border border-brand-orange/30 rounded-xl px-4 py-3 text-sm text-brand-gray leading-relaxed">
                    {groupSize === 4 ? (
                      <>
                        <span className="font-semibold text-brand-dark">Each pays $250 deposit.</span>{' '}
                        All 4 pay within 48 hrs → $8.00/lb for all{' '}
                        <span className="text-brand-green font-semibold">(~$90 savings each)</span>. One master cut sheet.
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-brand-dark">Each pays $500 deposit.</span>{' '}
                        Both pay within 48 hrs → $8.00/lb for both{' '}
                        <span className="text-brand-green font-semibold">(~$90 savings each)</span>.
                      </>
                    )}
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

                  {/* Cut sheet preference */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-dark mb-1">
                      Cut sheet preference
                    </label>
                    <div className="flex gap-3">
                      {(['master', 'shared'] as const).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setCutSheet(opt)}
                          className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors duration-150
                            ${cutSheet === opt
                              ? 'border-brand-orange bg-[#FFF5F0] text-brand-dark'
                              : 'border-[#E5E7EB] text-brand-gray hover:border-brand-orange/50'
                            }`}
                        >
                          {opt === 'master' ? "I'll do the cut sheet" : "We'll decide together"}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-brand-gray mt-2">
                      {cutSheet === 'master'
                        ? 'You fill out the cut sheet. Your partner receives a copy when locked.'
                        : 'Both of you can edit the cut sheet. You get final say if you disagree.'}
                    </p>
                  </div>

                  {/* Disclosure */}
                  <div className="bg-[#FFF5F0] border border-brand-orange/30 rounded-xl px-4 py-3 text-sm text-brand-gray leading-relaxed">
                    <span className="font-semibold text-brand-dark">Each person pays $250 deposit.</span>{' '}
                    Your final cost will be calculated at the Half Beef price of $8.25/lb.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── CTA Button ── */}
        <Button
          onClick={handleReserve}
          disabled={ctaDisabled || submitting}
          loading={submitting}
          fullWidth
          size="lg"
        >
          {submitting ? 'Checking availability…' : 'Reserve My Slot →'}
        </Button>
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
  id?: SizeOption;
  badge?: string;
  badgeColor?: string;
  title: string;
  price: string;
  deposit: string;
  yieldRange: string;
  note?: string;
  soldOut: boolean;
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
  selected,
  onSelect,
}: SizeCardProps) {
  return (
    <button
      onClick={onSelect}
      disabled={soldOut}
      aria-pressed={selected}
      className={`
        relative w-full text-left rounded-2xl overflow-hidden transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2
        ${soldOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${selected
          ? 'shadow-2xl scale-[1.02] ring-2 ring-brand-orange'
          : 'shadow-md hover:shadow-xl hover:scale-[1.01]'}
      `}
    >
      {/* Dark header */}
      <div className={`p-5 ${selected ? 'bg-brand-dark' : 'bg-brand-dark'}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            {badge && !soldOut && (
              <span className="inline-block text-xs font-body font-semibold px-2.5 py-0.5 rounded-full bg-brand-orange text-white mb-2">
                {badge}
              </span>
            )}
            {soldOut && (
              <span className="inline-block text-xs font-body font-semibold px-2.5 py-0.5 rounded-full bg-gray-500 text-white mb-2">
                Sold Out
              </span>
            )}
            <h3 className="font-display font-bold text-xl text-white">
              {title}
            </h3>
          </div>
          {selected && !soldOut && (
            <div className="w-6 h-6 rounded-full bg-brand-orange flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        {/* Price */}
        <div className="flex items-end gap-1">
          <span className="font-display font-black text-4xl text-white">
            {price.replace('/lb', '')}
          </span>
          <span className="font-body text-white/60 text-sm pb-1">/lb hanging weight</span>
        </div>
      </div>

      {/* White body */}
      <div className="bg-white p-5 border-x border-b border-gray-100 rounded-b-2xl">
        {/* Deposit */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
          <span className="text-brand-orange font-body font-semibold text-sm">
            {deposit}
          </span>
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-4">
          <li className="flex items-start gap-2 text-sm font-body text-brand-gray">
            <span className="text-brand-orange mt-0.5 flex-shrink-0">✓</span>
            <span>{yieldRange}</span>
          </li>
          <li className="flex items-start gap-2 text-sm font-body text-brand-gray">
            <span className="text-brand-orange mt-0.5 flex-shrink-0">✓</span>
            <span>Transport & processing included</span>
          </li>
          <li className="flex items-start gap-2 text-sm font-body text-brand-gray">
            <span className="text-brand-orange mt-0.5 flex-shrink-0">✓</span>
            <span>21–24 day dry age</span>
          </li>
          {title === 'Quarter Beef' && (
            <li className="flex items-start gap-2 text-sm font-body text-brand-gray">
              <span className="text-brand-orange mt-0.5 flex-shrink-0">✓</span>
              <span>Uses Legacy house cut sheet</span>
            </li>
          )}
          {title !== 'Quarter Beef' && (
            <li className="flex items-start gap-2 text-sm font-body text-brand-gray">
              <span className="text-brand-orange mt-0.5 flex-shrink-0">✓</span>
              <span>Custom cut sheet wizard</span>
            </li>
          )}
          {note && (
            <li className="flex items-start gap-2 text-sm font-body text-brand-gray italic">
              <span className="text-brand-orange mt-0.5 flex-shrink-0">✓</span>
              <span>{note}</span>
            </li>
          )}
        </ul>

        {/* CTA */}
        <div
          className={`w-full py-3 rounded-xl text-center text-sm font-body font-semibold transition-colors ${
            soldOut
              ? 'bg-gray-100 text-gray-400'
              : selected
              ? 'bg-brand-orange text-white'
              : 'bg-brand-warm text-brand-dark border border-brand-gray-light'
          }`}
        >
          {soldOut ? 'Sold Out' : selected ? 'Selected ✓' : `Select ${title}`}
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
