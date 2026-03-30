'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface Animal {
  id: string;
  name: string;
  butcher_date: string | null;
  estimated_ready_date: string | null;
  price_per_lb: number;
}

interface Slot {
  id?: string;
  depositAmount: number;
}

interface Session {
  id: string;
  purchase_type: 'whole' | 'half' | 'quarter';
  is_splitting?: boolean;
  contract_signed?: boolean;
  customer_id?: string;
}

interface ESignContractProps {
  session: Session;
  customer: Customer;
  animal: Animal;
  slot: Slot;
  onSigned: (sessionId: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatNow(): { date: string; time: string } {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  return { date, time };
}

function purchaseTypeLabel(type: string): string {
  switch (type) {
    case 'whole':   return 'Whole Beef';
    case 'half':    return 'Half Beef';
    case 'quarter': return 'Quarter Beef';
    default:        return type;
  }
}

// ─── Checkbox Clause ─────────────────────────────────────────────────────────

function ClauseCheckbox({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors duration-150 ${
        checked
          ? 'border-brand-orange bg-orange-50'
          : 'border-brand-gray-light bg-white hover:border-brand-orange/40'
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="flex-shrink-0 mt-0.5"
        style={{ width: 24, height: 24, accentColor: '#E85D24', cursor: 'pointer' }}
      />
      <span className="text-sm text-brand-dark leading-relaxed">{children}</span>
    </label>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ESignContract({
  session,
  customer,
  animal,
  slot,
  onSigned,
}: ESignContractProps) {
  const router = useRouter();

  // Checkbox state
  const [clause1, setClause1] = useState(false);
  const [clause2, setClause2] = useState(false);
  const [clause3, setClause3] = useState(false);

  // Signature state
  const [sigInput, setSigInput] = useState('');
  const [sigError, setSigError] = useState('');

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Date/time (stable after mount)
  const [datetime, setDatetime] = useState({ date: '', time: '' });
  useEffect(() => {
    setDatetime(formatNow());
  }, []);

  // Signature validation
  function handleSigChange(val: string) {
    setSigInput(val);
    if (sigError && val.trim().toLowerCase() === customer.name.trim().toLowerCase()) {
      setSigError('');
    }
  }

  function validateSig(): boolean {
    const match = sigInput.trim().toLowerCase() === customer.name.trim().toLowerCase();
    if (!match) {
      setSigError('Name must match your account name');
      return false;
    }
    setSigError('');
    return true;
  }

  const allChecked = clause1 && clause2 && clause3;
  const sigMatch = sigInput.trim().toLowerCase() === customer.name.trim().toLowerCase();
  const canSubmit = allChecked && sigInput.trim().length > 0 && sigMatch && !submitting;

  // Show splitting info box?
  const showSplitBox =
    session.purchase_type === 'whole' && session.is_splitting === true;

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!validateSig()) return;
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const sessionId = sessionStorage.getItem('session_id');
      const res = await fetch('/api/contract/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          signature: sigInput.trim(),
          contract_version: '2026-v1',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signing failed. Please try again.');

      onSigned(data.session_id);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[720px] mx-auto px-4 py-10">

      {/* Page Heading */}
      <div className="mb-8">
        <h1
          className="text-3xl md:text-4xl font-bold text-brand-dark mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Review &amp; Sign Your Buyers Agreement
        </h1>
        <p className="text-brand-gray text-base">
          Please read carefully. Check each box and sign to proceed to payment.
        </p>
      </div>

      {/* Customer Info */}
      <section className="bg-gray-50 border border-brand-gray-light rounded-2xl p-5 mb-6">
        <h2 className="font-semibold text-brand-dark text-sm uppercase tracking-wide mb-3">
          Customer Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-6 text-sm text-brand-dark">
          <div><span className="text-brand-gray">Name:</span> <span className="font-medium">{customer.name}</span></div>
          <div><span className="text-brand-gray">Email:</span> <span className="font-medium">{customer.email}</span></div>
          <div><span className="text-brand-gray">Phone:</span> <span className="font-medium">{customer.phone}</span></div>
          <div><span className="text-brand-gray">Address:</span> <span className="font-medium">{customer.address}</span></div>
          {(customer.city || customer.state || customer.zip) && (
            <div className="sm:col-span-2">
              <span className="text-brand-gray">City, State, Zip:</span>{' '}
              <span className="font-medium">
                {[customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Purchase Details */}
      <section className="bg-gray-50 border border-brand-gray-light rounded-2xl p-5 mb-6">
        <h2 className="font-semibold text-brand-dark text-sm uppercase tracking-wide mb-3">
          Purchase Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-6 text-sm text-brand-dark">
          <div><span className="text-brand-gray">Type:</span> <span className="font-medium">{purchaseTypeLabel(session.purchase_type)}</span></div>
          <div><span className="text-brand-gray">Animal:</span> <span className="font-medium">{animal.name}</span></div>
          <div><span className="text-brand-gray">Butcher Date:</span> <span className="font-medium">{formatDate(animal.butcher_date)}</span></div>
          <div><span className="text-brand-gray">Est. Ready Date:</span> <span className="font-medium">{formatDate(animal.estimated_ready_date)}</span></div>
          <div><span className="text-brand-gray">Price/lb:</span> <span className="font-medium">${Number(animal.price_per_lb).toFixed(2)}</span></div>
          <div><span className="text-brand-gray">Deposit Amount:</span> <span className="font-semibold text-brand-orange">${slot.depositAmount}</span></div>
        </div>
      </section>

      {/* Splitting Info Box */}
      {showSplitBox && (
        <section className="bg-gray-100 border border-gray-300 rounded-2xl p-5 mb-6">
          <p className="text-sm text-brand-dark leading-relaxed">
            <span className="font-semibold">Splitting Note:</span> If you are splitting the beef between
            multiple people, please remember that you are responsible for the cut sheet on the WHOLE animal
            and for picking it up. We can split a whole beef between 2 families that each want a custom cut
            half. Please have the other party call us and we will do their contract and cut sheet separately
            from yours. Whole beef pricing will apply to both of you.
          </p>
        </section>
      )}

      {/* Agreement Clauses */}
      <section className="mb-8">
        <h2
          className="text-xl font-bold text-brand-dark mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Agreement Terms
        </h2>
        <div className="space-y-3">
          <ClauseCheckbox id="clause1" checked={clause1} onChange={setClause1}>
            I agree that my <strong>NONREFUNDABLE DEPOSIT</strong> of{' '}
            <strong>${slot.depositAmount}</strong> is reserving my selections of meat and that the balance I
            owe will be due in full when I pick up my meat at 6105 Burgess Rd, Colorado Springs CO 80908,
            at a date and time to be determined.
          </ClauseCheckbox>

          <ClauseCheckbox id="clause2" checked={clause2} onChange={setClause2}>
            I agree that it is my responsibility to pick up my meat at 6105 Burgess Rd, Colorado Springs CO
            80908 on the date(s) and time(s) specified by Legacy Land &amp; Cattle and that these dates and
            times are to be determined once animals are sent for processing. I agree that if I am unable to
            pick up my meat, that I will send someone else to pick up my meat for me at the allotted time,
            as I fully understand that Legacy Land &amp; Cattle does not have enough freezer space to store
            my frozen meat.
          </ClauseCheckbox>

          <ClauseCheckbox id="clause3" checked={clause3} onChange={setClause3}>
            I agree that my final balance due is determined by the animals hanging weight and could vary
            depending on the size of the animal. I fully understand that Legacy Land &amp; Cattle will
            inform me of the hanging/yield weight(s) and the corresponding balance that I owe once the
            animals have been sent for processing, but prior to the pick-up date.
          </ClauseCheckbox>
        </div>
      </section>

      {/* Signature Section */}
      <section className="mb-8">
        <h2
          className="text-xl font-bold text-brand-dark mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Electronic Signature
        </h2>

        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label
              htmlFor="sig-input"
              className="block text-sm font-medium text-brand-dark mb-1.5"
            >
              Type your full legal name
            </label>
            <input
              id="sig-input"
              type="text"
              value={sigInput}
              onChange={(e) => handleSigChange(e.target.value)}
              onBlur={validateSig}
              placeholder="Enter your full legal name"
              autoComplete="name"
              className={`form-input ${sigError ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {sigError && (
              <p className="text-red-600 text-sm mt-1">{sigError}</p>
            )}
          </div>

          {/* Signature Preview */}
          <div className="min-h-[70px] bg-gray-50 border border-brand-gray-light rounded-xl px-4 py-3 flex items-center">
            {sigInput.trim() ? (
              <span
                style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: '2rem',
                  color: '#0F0F0F',
                  lineHeight: 1.2,
                }}
              >
                {sigInput}
              </span>
            ) : (
              <span
                style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: '2rem',
                  color: '#D1D5DB',
                  lineHeight: 1.2,
                }}
              >
                Your signature will appear here
              </span>
            )}
          </div>

          {/* Date / Time */}
          {datetime.date && (
            <div className="text-sm text-brand-gray">
              <span className="font-medium">Date:</span> {datetime.date} &nbsp;|&nbsp;{' '}
              <span className="font-medium">Time:</span> {datetime.time}
            </div>
          )}

          {/* Legal Notice */}
          <p className="text-xs text-brand-gray leading-relaxed">
            This electronic signature is legally binding under the E-SIGN Act and recorded with your IP
            address and timestamp.
          </p>
        </div>
      </section>

      {/* Submit Error */}
      {submitError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {submitError}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full min-h-[48px] rounded-xl font-semibold text-white text-base transition-all duration-150 flex items-center justify-center gap-2 ${
          canSubmit
            ? 'bg-[#E85D24] hover:bg-[#D14E1A] active:scale-[0.98]'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        {submitting ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing...
          </>
        ) : (
          'Sign & Continue to Payment →'
        )}
      </button>

      {/* Helper text when disabled */}
      {!canSubmit && !submitting && (
        <p className="text-center text-xs text-brand-gray mt-2">
          {!allChecked && 'Check all 3 boxes above. '}
          {allChecked && sigInput.trim().length === 0 && 'Enter your full name to sign. '}
          {allChecked && sigInput.trim().length > 0 && !sigMatch && 'Name must match your account name. '}
        </p>
      )}
    </div>
  );
}
