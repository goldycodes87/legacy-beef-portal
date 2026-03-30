'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import ReservationProgress from '@/components/ReservationProgress';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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
  | { status: 'success'; session: Session; animal: Animal; depositAmount: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function depositForType(type: string): number {
  switch (type) {
    case 'whole': return 850;
    case 'half': return 500;
    case 'quarter': return 250;
    default: return 500;
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
    case 'whole': return 'Whole Beef';
    case 'half': return 'Half Beef';
    case 'quarter': return 'Quarter Beef';
    default: return type;
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
    router.push(`/session/${session.id}`);
  }

  function handleDoItLater() {
    router.push('/?message=Check+your+email+to+return+anytime');
  }

  return (
    <main className="max-w-[600px] mx-auto px-4 py-12">
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

      <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">
        <div className="bg-[#2D5016] px-6 py-4">
          <p className="text-[#C4A46B] text-xs uppercase tracking-widest mb-1">Order Summary</p>
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
          <OrderRow label="Deposit Paid" value={`$${depositAmount}`} highlight />
        </div>
      </div>

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

// ─── Stripe Payment Form ──────────────────────────────────────────────────────

function StripePaymentForm({
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
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/api/payments/stripe-return?session_id=${session.id}`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed');
      setPaying(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full mt-4 py-4 px-6 rounded-xl text-white font-semibold bg-[#E85D24] disabled:opacity-60"
      >
        {paying ? 'Processing…' : `Pay $${depositAmount} Deposit`}
      </button>
    </form>
  );
}

// ─── Main Payment Form ─────────────────────────────────────────────────────────

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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ach' | 'cash'>('card');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ discount: number; message: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [finalAmount, setFinalAmount] = useState(depositAmount);
  const [surcharge, setSurcharge] = useState(0);
  const [loadingIntent, setLoadingIntent] = useState(false);

  async function applyCoupon() {
    setCouponError(null);
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, session_id: session.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCouponError(data.error);
      return;
    }
    setCouponApplied({ discount: data.discount_amount, message: data.message });
  }

  async function loadPaymentIntent() {
    if (paymentMethod === 'cash') return;
    setLoadingIntent(true);
    const res = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        payment_method_type: paymentMethod,
        coupon_code: couponCode || null,
      }),
    });
    const data = await res.json();
    if (data.waived) {
      onSuccess();
      return;
    }
    setClientSecret(data.client_secret);
    setFinalAmount(Math.round(data.amount_cents / 100));
    setSurcharge(Math.round(data.surcharge_cents / 100));
    setLoadingIntent(false);
  }

  useEffect(() => {
    loadPaymentIntent();
  }, [paymentMethod]);

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
          <OrderRow label="Butcher Date" value={animal.butcher_date ? formatDate(animal.butcher_date) : 'TBD'} />
          <OrderRow label="Est. Ready" value={animal.estimated_ready_date ? formatDate(animal.estimated_ready_date) : 'TBD'} />
          {couponApplied && <OrderRow label="Coupon discount" value={`-$${couponApplied.discount}`} />}
          {surcharge > 0 && <OrderRow label="Card processing fee (3%)" value={`+$${surcharge}`} />}
          <OrderRow label="Deposit Due Today" value={`$${finalAmount}`} highlight />
          <p className="text-xs text-[#6B7280]">Balance due at pickup based on hanging weight</p>
        </div>
      </div>

      {/* Coupon Code */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#0F0F0F] mb-2">Have a coupon code?</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="flex-1 border border-[#E5E7EB] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D24]"
          />
          <button
            onClick={applyCoupon}
            className="px-4 py-2 rounded-xl bg-[#0F0F0F] text-white text-sm font-semibold"
          >
            Apply
          </button>
        </div>
        {couponApplied && <p className="text-green-600 text-sm mt-1">✓ {couponApplied.message}</p>}
        {couponError && <p className="text-red-600 text-sm mt-1">{couponError}</p>}
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#0F0F0F] mb-3">Payment Method</p>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ['card', '💳', 'Credit/Debit Card', '3% fee applies'],
              ['ach', '🏦', 'Bank Transfer (ACH)', 'No fee · 3-5 days'],
              ['cash', '💵', 'Cash or Check', 'Pay at pickup'],
            ] as const
          ).map(([method, icon, label, note]) => (
            <button
              key={method}
              onClick={() => setPaymentMethod(method)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                paymentMethod === method
                  ? 'border-[#E85D24] bg-[#FFF5F0]'
                  : 'border-[#E5E7EB] bg-white hover:border-[#E85D24]/50'
              }`}
            >
              <div className="text-xl mb-1">{icon}</div>
              <p className="text-xs font-semibold text-[#0F0F0F]">{label}</p>
              <p className="text-xs text-[#6B7280]">{note}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ACH Notice */}
      {paymentMethod === 'ach' && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <p className="font-semibold mb-1">Bank Transfer Note</p>
          <p>Your slot will be held while your transfer processes (3-5 business days). You'll receive a confirmation email once it clears.</p>
        </div>
      )}

      {/* Cash Notice */}
      {paymentMethod === 'cash' && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <p className="font-semibold mb-1">Cash or Check</p>
          <p>Your spot is reserved but not confirmed until payment is received. Make checks payable to Legacy Land & Cattle.</p>
          <button
            onClick={async () => {
              const res = await fetch('/api/payments/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: session.id, method: 'cash_check', amount_cents: depositAmount * 100 }),
              });
              if (res.ok) onSuccess();
            }}
            className="mt-3 w-full py-3 rounded-xl bg-[#E85D24] text-white font-semibold text-sm"
          >
            Reserve My Spot (Pay Later)
          </button>
        </div>
      )}

      {/* Stripe Elements */}
      {(paymentMethod === 'card' || paymentMethod === 'ach') && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripePaymentForm
            session={session}
            animal={animal}
            customer={customer}
            depositAmount={finalAmount}
            onSuccess={onSuccess}
          />
        </Elements>
      )}

      {loadingIntent && (
        <div className="flex justify-center py-4">
          <svg className="animate-spin h-6 w-6 text-[#E85D24]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}
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

      const res = await fetch(`/api/session/${sessionId}`);
      if (!res.ok) {
        router.replace('/select-size?error=session_not_found');
        return;
      }

      const data = await res.json();

      const sessionData: Session = {
        id: data.id,
        customer_id: data.customer_id,
        animal_id: data.animal_id,
        purchase_type: data.purchase_type,
        contract_signed: data.contract_signed,
        status: data.status,
      };

      if (!sessionData.contract_signed) {
        router.replace('/contract');
        return;
      }

      if (sessionData.status === 'deposit_paid') {
        router.replace(`/session/${sessionId}`);
        return;
      }

      const customer: Customer = data.customer;
      const animal: Animal = data.animal;

      if (!customer) {
        setState({ status: 'error', message: 'Could not load customer details.' });
        return;
      }

      if (!animal) {
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
          alt="Legacy Land & Cattle"
          width={140}
          height={60}
          className="h-10 w-auto object-contain"
        />
      </header>

      <ReservationProgress currentStep="deposit" />

      {state.status === 'loading' && (
        <main className="max-w-[600px] mx-auto px-4 py-12 text-center">
          <p className="text-[#6B7280]">Loading payment details...</p>
        </main>
      )}

      {state.status === 'error' && (
        <main className="max-w-[600px] mx-auto px-4 py-12 text-center">
          <p className="text-red-600">{state.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 rounded-lg text-white"
            style={{ backgroundColor: '#E85D24' }}
          >
            Try Again
          </button>
        </main>
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
