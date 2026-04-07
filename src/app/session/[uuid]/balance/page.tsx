'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ─── Stripe Checkout Form ─────────────────────────────────────────────────────

function StripeCheckoutForm({
  uuid,
  amountDue,
}: {
  uuid: string;
  amountDue: number;
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
        return_url: `${window.location.origin}/api/payments/balance-return?session_id=${uuid}`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed');
      setPaying(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <PaymentElement />
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full mt-4 py-4 px-6 rounded-xl text-white font-semibold bg-brand-orange disabled:opacity-60 hover:opacity-90"
      >
        {paying ? 'Processing…' : `Pay $${amountDue.toFixed(2)}`}
      </button>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BalancePage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [session, setSession] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const res = await fetch(`/api/session/${uuid}`);
      const data = await res.json();
      setSession(data);
      setLoading(false);

      if (data.balance_paid) {
        router.push(`/session/${uuid}`);
      }
    };
    fetchSession();
  }, [uuid, router]);

  // Load payment intent when card is selected
  useEffect(() => {
    if (paymentMethod !== 'card' || !session) return;
    setClientSecret(null);
    setLoadingIntent(true);

    const fetchIntent = async () => {
      const res = await fetch('/api/payments/create-balance-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: uuid }),
      });
      const data = await res.json();
      setClientSecret(data.client_secret);
      setLoadingIntent(false);
    };

    fetchIntent().catch(() => setLoadingIntent(false));
  }, [paymentMethod, session, uuid]);

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!session) return <div className="text-center py-12">Session not found</div>;

  const balanceDue = session.balance_due || 0;

  return (
    <div className="min-h-screen bg-brand-warm">
      <div className="flex justify-center pt-8 mb-8">
        <Image
          src="/images/LLC_Logo.svg"
          alt="Legacy Land & Cattle"
          width={160}
          height={72}
          className="h-28 w-auto mx-auto block"
        />
      </div>

      <div className="max-w-2xl mx-auto pb-12 px-4">

        {/* Balance Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-display font-bold text-brand-dark mb-4">Balance Due</h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-brand-gray">Animal</span>
              <span className="font-semibold text-brand-dark">{session.animal?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-gray">Purchase Type</span>
              <span className="font-semibold text-brand-dark capitalize">{session.purchase_type}</span>
            </div>
            {session.hanging_weight_lbs && (
              <div className="flex justify-between">
                <span className="text-brand-gray">Hanging Weight</span>
                <span className="font-semibold text-brand-dark">{session.hanging_weight_lbs} lbs</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-brand-gray">Price per lb</span>
              <span className="font-semibold text-brand-dark">${session.price_per_lb?.toFixed(2)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-lg">
              <span className="font-bold text-brand-dark">Balance Due</span>
              <span className="font-bold text-brand-orange text-2xl">${balanceDue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-xl font-display font-bold text-brand-dark mb-4">Payment Method</h3>

          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer" style={{ borderColor: paymentMethod === 'card' ? '#E85D24' : '#e5e7eb' }}>
              <input
                type="radio"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
              />
              <div>
                <p className="font-semibold text-brand-dark">Credit/Debit Card</p>
                <p className="text-sm text-brand-gray">3% processing fee included</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer" style={{ borderColor: paymentMethod === 'check' ? '#E85D24' : '#e5e7eb' }}>
              <input
                type="radio"
                checked={paymentMethod === 'check'}
                onChange={() => setPaymentMethod('check')}
              />
              <div>
                <p className="font-semibold text-brand-dark">Check or Cash at Pickup</p>
                <p className="text-sm text-brand-gray">Pay ${balanceDue.toFixed(2)} at pickup</p>
              </div>
            </label>
          </div>

          {/* Card payment — Stripe Elements */}
          {paymentMethod === 'card' && (
            <div className="mt-6">
              {loadingIntent && (
                <div className="flex justify-center py-4">
                  <svg className="animate-spin h-6 w-6 text-brand-orange" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripeCheckoutForm uuid={uuid} amountDue={balanceDue} />
                </Elements>
              )}
            </div>
          )}

          {/* Check/cash — continue button */}
          {paymentMethod === 'check' && (
            <button
              onClick={() => router.push(`/session/${uuid}`)}
              className="w-full mt-6 bg-brand-orange text-white py-3 rounded-lg font-semibold hover:opacity-90"
            >
              Continue to Pickup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
