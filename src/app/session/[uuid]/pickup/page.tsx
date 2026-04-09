'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PickupWindow {
  id: string;
  label: string;
  pickup_date: string;
  start_time: string;
  end_time: string;
  appointment_count: number;
  max_slots: number;
}

function BalancePaymentForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const uuid = params.uuid as string;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/api/payments/balance-return?session_id=${uuid}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setError(error.message || 'Payment failed');
      setPaying(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handlePay} className="mt-4">
      <PaymentElement />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full mt-4 py-4 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl font-body font-bold text-lg disabled:opacity-50 transition-colors"
      >
        {paying ? 'Processing…' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function PickupPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [session, setSession] = useState<any>(null);
  const [windows, setWindows] = useState<PickupWindow[]>([]);
  const [step, setStep] = useState(1);
  const [selectedWindow, setSelectedWindow] = useState<PickupWindow | null>(null);
  const [isAlternate, setIsAlternate] = useState(false);
  const [alternateData, setAlternateData] = useState({
    name: '',
    email: '',
    phone: '',
    waiverSigned: false,
  });
  const [balanceMethod, setBalanceMethod] = useState<'card' | 'cash' | null>(null);
  const [balanceClientSecret, setBalanceClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [balancePaying, setBalancePaying] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {

      const res = await fetch(`/api/session/${uuid}`);
      const data = await res.json();
      setSession(data);

      if (data.status !== 'beef_ready') {
        router.push(`/session/${uuid}`);
        return;
      }

      if (data.pickup_appointment) {
        // Show confirmation screen instead
        setStep(99);
        return;
      }

      // Fetch windows
      const winRes = await fetch('/api/pickup-windows');
      const winData = await winRes.json();
      setWindows(winData);
    };
    checkAccess();
  }, [uuid, router]);

  const handleSelectWindow = (window: PickupWindow) => {
    setSelectedWindow(window);
    setStep(2);
  };

  const handleConfirm = async () => {
    const res = await fetch(`/api/pickup/${uuid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickup_window_id: selectedWindow?.id,
        is_alternate: isAlternate,
        pickup_person_name: isAlternate ? alternateData.name : session.customer.name,
        pickup_person_email: isAlternate ? alternateData.email : session.customer.email,
        pickup_person_phone: isAlternate ? alternateData.phone : session.customer.phone,
        waiver_signed: isAlternate ? alternateData.waiverSigned : true,
      }),
    });

    if (res.ok) {
      setStep(99);
    } else {
      const err = await res.json();
      alert('Failed: ' + (err.error || 'Unknown error'));
    }
  };

  const handleSelectCard = async () => {
    setBalanceMethod('card');
    if (balanceClientSecret) return;

    setLoadingIntent(true);
    const res = await fetch('/api/payments/create-balance-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: uuid }),
    });
    const data = await res.json();
    setBalanceClientSecret(data.client_secret);
    setLoadingIntent(false);
  };

  const handleCashBalance = async () => {
    setBalanceMethod('cash');
    await fetch(`/api/session/${uuid}/mark-cash-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    setSession({ ...session, balance_paid: true, balance_payment_method: 'cash' });
  };

  function formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, '0')}${period}`;
  }

  if (!session) return <div className="text-center py-12">Loading...</div>;

  if (step === 99) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4 text-center">
        <Image
          src="/images/LLC_Logo_white.svg"
          alt="Legacy Land & Cattle"
          width={300}
          height={130}
          className="h-32 w-auto mx-auto mb-8"
        />
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="font-display font-black text-white mb-3"
          style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}>
          You&apos;re All Set!
        </h1>
        <p className="font-body text-white/70 text-lg max-w-sm mb-8">
          Your pickup is confirmed. We&apos;ll see you soon with your beef!
        </p>
        <div className="bg-white/10 rounded-2xl p-6 max-w-sm w-full">
          <p className="font-body text-white/60 text-sm mb-1">Pickup Address</p>
          <p className="font-display font-bold text-white text-lg">
            6105 Burgess Rd
          </p>
          <p className="font-body text-white/80">Colorado Springs, CO 80908</p>
          <a href="tel:7194595151"
            className="font-body text-brand-orange mt-3 block">
            719.459.5151
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-warm">
      {/* Dark hero header */}
      <div className="bg-brand-dark px-4 pt-12 pb-16 text-center relative overflow-hidden">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

        <div className="relative z-10">
          {/* White logo — large */}
          <div className="flex justify-center mb-6">
            <Image
              src="/images/LLC_Logo_white.svg"
              alt="Legacy Land & Cattle"
              width={300}
              height={130}
              className="h-32 md:h-40 w-auto"
              priority
            />
          </div>

          {/* Greeting */}
          <p className="font-body text-white/70 text-lg mb-2">
            {session?.customer?.name?.split(' ')[0]}, your beef is ready!
          </p>

          {/* Hero headline */}
          <h1 className="font-display font-black text-white mb-4"
            style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}>
            Time to Pick Up Your Beef 🥩
          </h1>

          <p className="font-body text-white/70 text-base max-w-md mx-auto">
            Beef pickup is always a good day. Select a time that works
            for you — if anything comes up, just give us a call.
          </p>
        </div>
      </div>

      {/* Content area — cream background */}
      <div className="max-w-2xl mx-auto px-4 mt-6 pb-16">

        {/* Balance card — floats over the transition */}
        {session?.balance_due > 0 && !session?.balance_paid && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-brand-orange">
            <p className="font-body text-brand-gray text-sm">Balance Due</p>
            <p className="font-display font-bold text-3xl text-brand-dark mb-4">
              ${session.balance_due.toFixed(2)}
            </p>
            <p className="font-body text-brand-gray text-sm mb-4">
              Your balance must be settled before selecting a pickup time.
            </p>

            <div className="flex gap-3 mb-4">
              <button
                onClick={handleSelectCard}
                className={`flex-1 py-3 rounded-xl border-2 font-body font-semibold text-sm transition-colors ${balanceMethod === 'card'
                  ? 'border-brand-orange bg-brand-orange-light text-brand-dark'
                  : 'border-brand-gray-light text-brand-gray hover:border-brand-orange'}`}
              >
                💳 Pay by Card
              </button>
              <button
                onClick={handleCashBalance}
                className={`flex-1 py-3 rounded-xl border-2 font-body font-semibold text-sm transition-colors ${balanceMethod === 'cash'
                  ? 'border-brand-orange bg-brand-orange-light text-brand-dark'
                  : 'border-brand-gray-light text-brand-gray hover:border-brand-orange'}`}
              >
                💵 Cash/Check at Pickup
              </button>
            </div>

            {balanceMethod === 'card' && (
              loadingIntent ? (
                <div className="text-center py-4 text-brand-gray">Loading payment form…</div>
              ) : balanceClientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret: balanceClientSecret }}>
                  <BalancePaymentForm
                    amount={session.balance_due}
                    onSuccess={() => setSession({ ...session, balance_paid: true })}
                  />
                </Elements>
              ) : null
            )}

            {balanceMethod === 'cash' && (
              <div className="bg-brand-green-pale border border-green-200 rounded-xl p-4 mt-2">
                <p className="font-body font-semibold text-brand-green text-sm">
                  ✓ Got it — please bring ${session.balance_due.toFixed(2)} cash or check to pickup.
                </p>
              </div>
            )}
          </div>
        )}

        {session?.balance_paid && (
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border-l-4 border-green-500">
            <p className="font-body font-semibold text-green-700">
              ✓ Balance paid — you&apos;re all set!
            </p>
          </div>
        )}

        {/* Step 1 — Schedule Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-2xl text-brand-dark mb-4">
              Choose Your Pickup Time
            </h2>
            {session?.balance_due > 0 && !session?.balance_paid && balanceMethod !== 'cash' && (
              <p className="font-body text-amber-600 text-sm mb-4 font-semibold">
                ⚠️ Please resolve your balance above before selecting a pickup time.
              </p>
            )}
            <div className={session?.balance_due > 0 && !session?.balance_paid && balanceMethod !== 'cash' ? 'opacity-40 pointer-events-none' : ''}>
            {windows.map((w) => (
              <button key={w.id} onClick={() => handleSelectWindow(w)}
                className="w-full text-left bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all border-2 border-transparent hover:border-brand-orange group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-xl text-brand-dark">
                      {new Date(w.pickup_date + 'T00:00:00').toLocaleDateString(
                        'en-US', { weekday: 'long', month: 'long', day: 'numeric' }
                      )}
                    </p>
                    <p className="font-body text-brand-gray text-base mt-1">
                      {formatTime(w.start_time)} – {formatTime(w.end_time)} MST
                    </p>
                    <p className="font-body text-brand-orange font-semibold text-sm mt-1">
                      {w.label}
                    </p>
                  </div>
                  <div className="bg-brand-orange group-hover:bg-brand-orange-hover text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors text-lg">
                    →
                  </div>
                </div>
              </button>
            ))}
            </div>
          </div>
        )}

        {/* Step 2 — Who's Picking Up? */}
        {step === 2 && (
          <>
            <h2 className="font-display font-bold text-2xl text-brand-dark mb-2">
              Who&apos;s Picking Up?
            </h2>
            <p className="font-body text-brand-gray mb-6">
              We&apos;ll have your order ready when you arrive.
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-body text-brand-dark font-semibold mb-1">Name</label>
                <input
                  type="text"
                  value={session?.customer?.name || ''}
                  disabled
                  className="w-full px-4 py-3 bg-brand-gray-pale rounded-xl border border-brand-gray-light font-body text-brand-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-body text-brand-dark font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={session?.customer?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-brand-gray-pale rounded-xl border border-brand-gray-light font-body text-brand-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-body text-brand-dark font-semibold mb-1">Phone</label>
                <input
                  type="tel"
                  value={session?.customer?.phone || ''}
                  disabled
                  className="w-full px-4 py-3 bg-brand-gray-pale rounded-xl border border-brand-gray-light font-body text-brand-dark"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 bg-white border-2 border-brand-gray-light rounded-xl cursor-pointer hover:border-brand-orange transition-colors mt-4">
              <input
                type="checkbox"
                checked={isAlternate}
                onChange={(e) => setIsAlternate(e.target.checked)}
                className="w-5 h-5 accent-brand-orange"
              />
              <span className="font-body font-semibold text-brand-dark">
                Someone else is picking up my beef
              </span>
            </label>

            {isAlternate && (
              <div className="mt-6 space-y-3 p-4 bg-white rounded-xl border-2 border-brand-gray-light">
                <div>
                  <label className="block text-sm font-body text-brand-dark font-semibold mb-1">Pickup Person Name</label>
                  <input
                    type="text"
                    value={alternateData.name}
                    onChange={(e) => setAlternateData({ ...alternateData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-brand-gray-light rounded-xl font-body text-brand-dark focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-body text-brand-dark font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={alternateData.email}
                    onChange={(e) => setAlternateData({ ...alternateData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-brand-gray-light rounded-xl font-body text-brand-dark focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-body text-brand-dark font-semibold mb-1">Phone</label>
                  <input
                    type="tel"
                    value={alternateData.phone}
                    onChange={(e) => setAlternateData({ ...alternateData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-brand-gray-light rounded-xl font-body text-brand-dark focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <label className="flex items-start gap-3 p-3 bg-white border-2 border-brand-gray-light rounded-xl mt-4">
                  <input
                    type="checkbox"
                    checked={alternateData.waiverSigned}
                    onChange={(e) => setAlternateData({ ...alternateData, waiverSigned: e.target.checked })}
                    className="mt-1 w-5 h-5 accent-brand-orange"
                  />
                  <span className="font-body text-sm text-brand-dark">
                    I understand that once beef is released to the designated person, Legacy Land &amp; Cattle is not responsible for condition or handling. The pickup person accepts full responsibility upon collection.
                  </span>
                </label>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-4 border-2 border-brand-gray-light text-brand-gray rounded-xl font-body font-semibold">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-4 py-4 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl font-body font-bold text-lg transition-colors">
                Next
              </button>
            </div>
          </>
        )}

        {/* Step 3 — Confirm Pickup */}
        {step === 3 && (
          <>
            <h2 className="font-display font-bold text-2xl text-brand-dark mb-6">
              Confirm Your Pickup
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="font-body text-brand-gray text-sm">Date</p>
                <p className="font-display font-bold text-xl text-brand-dark">
                  {selectedWindow ? new Date(selectedWindow.pickup_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
                </p>
              </div>
              <div>
                <p className="font-body text-brand-gray text-sm">Time</p>
                <p className="font-display font-bold text-xl text-brand-dark">
                  {selectedWindow ? `${formatTime(selectedWindow.start_time)} – ${formatTime(selectedWindow.end_time)} MST` : ''}
                </p>
              </div>
              <div>
                <p className="font-body text-brand-gray text-sm">Pickup Person</p>
                <p className="font-display font-bold text-xl text-brand-dark">
                  {isAlternate ? alternateData.name : session?.customer?.name}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-4 border-2 border-brand-gray-light text-brand-gray rounded-xl font-body font-semibold">
                Back
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-4 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl font-body font-bold text-lg transition-colors">
                Confirm Pickup
              </button>
            </div>
          </>
        )}

        {/* Pickup address card — always visible */}
        <div className="mt-8 bg-brand-dark rounded-2xl p-6 text-white text-center">
          <p className="font-display font-bold text-lg mb-2">📍 Pickup Address</p>
          <p className="font-body text-white/80">6105 Burgess Rd</p>
          <p className="font-body text-white/80">Colorado Springs, CO 80908</p>
          <a href="tel:7194595151"
            className="font-body text-brand-orange mt-3 block text-sm">
            719.459.5151
          </a>
        </div>

      </div>
    </div>
  );
}
