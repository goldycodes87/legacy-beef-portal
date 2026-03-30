'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ReservationProgress from '@/components/ReservationProgress';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Animal {
  id: string;
  name: string;
  butcher_date: string | null;
  estimated_ready_date: string | null;
  price_per_lb: number;
}

interface Session {
  id: string;
  customer_id: string;
  animal_id: string;
  purchase_type: 'whole' | 'half' | 'quarter';
  contract_signed?: boolean;
  status?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; session: Session; animal: Animal; customer: Customer; depositAmount: number }
  | { status: 'paying' }
  | { status: 'success'; session: Session; animal: Animal; depositAmount: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function depositForType(type: string): number {
  switch (type) {
    case 'whole':   return 850;
    case 'half':    return 500;
    case 'quarter': return 250;
    default:        return 500;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function purchaseTypeLabel(type: string): string {
  switch (type) {
    case 'whole':   return 'Whole Beef';
    case 'half':    return 'Half Beef';
    case 'quarter': return 'Quarter Beef';
    default:        return type;
  }
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({
  session,
  animal,
  depositAmount,
}: {
  session: Session;
  animal: Animal;
  depositAmount: number;
}) {
  const router = useRouter();

  function handleStartCutSheet() {
    // Clear session from sessionStorage — user is authed via Supabase
    router.push(`/session/${session.id}`);
  }

  function handleDoItLater() {
    router.push('/?message=Check+your+email+to+return+anytime');
  }

  return (
    <main className="max-w-[600px] mx-auto px-4 py-12">
      {/* Confirmation heading */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🎉</div>
        <h1
          className="text-3xl md:text-4xl font-bold text-[#0F0F0F] mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          You&apos;re confirmed!
        </h1>
        <p className="text-[#6B7280] text-base">
          Your deposit of ${depositAmount} has been received. Your beef is locked in.
        </p>
      </div>

      {/* Order Summary Card */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">
        <div className="bg-[#2D5016] px-6 py-4">
          <p className="text-[#C4A46B] text-xs uppercase tracking-widest mb-1">Order Summary</p>
          <h2 className="text-white text-xl font-serif font-bold">
            {animal.name}
          </h2>
        </div>

        <div className="px-6 py-5 space-y-3">
          <OrderRow label="Size" value={purchaseTypeLabel(session.purchase_type)} />
          <OrderRow label="Animal" value={animal.name} />
          <OrderRow
            label="Butcher Date"
            value={animal.butcher_date ? formatDate(animal.butcher_date) : 'TBD'}
          />
          <OrderRow
            label="Est. Ready"
            value={animal.estimated_ready_date ? formatDate(animal.estimated_ready_date) : 'TBD'}
          />
          <OrderRow
            label="Deposit Paid"
            value={`$${depositAmount}`}
            highlight
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleStartCutSheet}
          className="w-full py-4 px-6 rounded-xl text-white font-semibold text-base transition-colors"
          style={{ backgroundColor: '#E85D24' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D14E1A')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E85D24')}
        >
          Start My Cut Sheet →
        </button>

        <button
          onClick={handleDoItLater}
          className="w-full py-4 px-6 rounded-xl font-semibold text-base border-2 border-[#6B7280] text-[#6B7280] bg-white hover:border-[#0F0F0F] hover:text-[#0F0F0F] transition-colors"
        >
          I&apos;ll Do It Later
        </button>

        <p className="text-center text-xs text-[#6B7280] mt-1">
          Check your email to return anytime
        </p>
      </div>
    </main>
  );
}

function OrderRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span
        className={`text-sm text-right font-semibold ${
          highlight ? 'text-[#2D5016] text-base' : 'text-gray-900'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Payment Form ─────────────────────────────────────────────────────────────

function PaymentForm({
  session,
  animal,
  customer,
  depositAmount,
  onSuccess,
}: {
  session: Session;
  animal: Animal;
  customer: Customer;
  depositAmount: number;
  onSuccess: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePayDeposit() {
    setPaying(true);
    setError(null);

    try {
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          amount_cents: depositAmount * 100,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Payment failed (${res.status})`);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setPaying(false);
    }
  }

  return (
    <main className="max-w-[600px] mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1
          className="text-3xl font-bold text-[#0F0F0F] mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Pay Your Deposit
        </h1>
        <p className="text-[#6B7280] text-base">
          Lock in your beef reservation with a deposit.
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
        <div className="bg-[#2D5016] px-6 py-4">
          <p className="text-[#C4A46B] text-xs uppercase tracking-widest mb-1">Your Order</p>
          <h2 className="text-white text-xl font-serif font-bold">{animal.name}</h2>
        </div>
        <div className="px-6 py-5 space-y-3">
          <OrderRow label="Size" value={purchaseTypeLabel(session.purchase_type)} />
          <OrderRow label="Animal" value={animal.name} />
          <OrderRow
            label="Butcher Date"
            value={animal.butcher_date ? formatDate(animal.butcher_date) : 'TBD'}
          />
          <OrderRow
            label="Est. Ready"
            value={animal.estimated_ready_date ? formatDate(animal.estimated_ready_date) : 'TBD'}
          />
        </div>
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-700">Deposit Due Today</span>
            <span className="text-2xl font-bold text-[#2D5016]">${depositAmount}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Balance due at pickup</p>
        </div>
      </div>

      {/* Payment Button */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      <button
        onClick={handlePayDeposit}
        disabled={paying}
        className="w-full py-4 px-6 rounded-xl text-white font-semibold text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: paying ? '#D14E1A' : '#E85D24' }}
      >
        {paying ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing…
          </>
        ) : (
          `Pay $${depositAmount} Deposit`
        )}
      </button>

      <p className="text-center text-xs text-[#6B7280] mt-4">
        Secure payment. You&apos;ll receive a confirmation email after payment.
      </p>
    </main>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function PaymentPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    async function init() {
      const sessionId = sessionStorage.getItem('session_id');
      if (!sessionId) {
        router.replace('/select-size?error=session_not_found');
        return;
      }

      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id, customer_id, animal_id, purchase_type, contract_signed, status')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        router.replace('/select-size?error=session_not_found');
        return;
      }

      if (!sessionData.contract_signed) {
        router.replace('/contract');
        return;
      }

      // If already deposit_paid → jump straight to session page
      if (sessionData.status === 'deposit_paid') {
        router.replace(`/session/${sessionId}`);
        return;
      }

      // Load customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, name, email')
        .eq('id', sessionData.customer_id)
        .single();

      if (customerError || !customer) {
        setState({ status: 'error', message: 'Could not load customer details.' });
        return;
      }

      // Load animal
      const { data: animal, error: animalError } = await supabase
        .from('animals')
        .select('id, name, butcher_date, estimated_ready_date, price_per_lb')
        .eq('id', sessionData.animal_id)
        .single();

      if (animalError || !animal) {
        setState({ status: 'error', message: 'Could not load animal details.' });
        return;
      }

      const depositAmount = depositForType(sessionData.purchase_type);

      setState({
        status: 'ready',
        session: sessionData,
        animal,
        customer,
        depositAmount,
      });
    }

    init().catch((err) => {
      console.error('Payment page init error:', err);
      setState({ status: 'error', message: 'Unexpected error. Please try again.' });
    });
  }, [router]);

  function handlePaymentSuccess() {
    if (state.status !== 'ready') return;
    setState({
      status: 'success',
      session: state.session,
      animal: state.animal,
      depositAmount: state.depositAmount,
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <header className="bg-[#0F0F0F] px-4 py-4 flex items-center sticky top-0 z-10">
        <Image
          src="/images/LLC_Logo.svg"
          alt="Legacy Land &amp; Cattle"
          width={140}
          height={60}
          className="h-10 w-auto object-contain"
        />
      </header>

      {/* Only show progress bar when not on success screen */}
      {state.status !== 'success' && (
        <ReservationProgress currentStep="deposit" />
      )}

      {state.status === 'loading' && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <svg className="animate-spin h-10 w-10 text-[#E85D24]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-[#6B7280] text-sm">Loading your order…</p>
        </div>
      )}

      {state.status === 'error' && (
        <div className="max-w-[600px] mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1
            className="text-2xl font-bold text-[#0F0F0F] mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Something went wrong
          </h1>
          <p className="text-[#6B7280] mb-6">{state.message}</p>
          <button
            onClick={() => router.push('/select-size')}
            className="px-6 py-3 rounded-xl bg-[#E85D24] text-white font-semibold"
          >
            Start Over
          </button>
        </div>
      )}

      {state.status === 'ready' && (
        <PaymentForm
          session={state.session}
          animal={state.animal}
          customer={state.customer}
          depositAmount={state.depositAmount}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {state.status === 'success' && (
        <SuccessScreen
          session={state.session}
          animal={state.animal}
          depositAmount={state.depositAmount}
        />
      )}
    </div>
  );
}
