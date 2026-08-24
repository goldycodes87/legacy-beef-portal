'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { PaymentForm, CreditCard } from 'react-square-web-payments-sdk';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BalancePage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surchargePct, setSurchargePct] = useState(3);

  useEffect(() => {
    const fetchSession = async () => {
      const res = await fetch(`/api/session/${uuid}`);
      const data = await res.json();
      setSession(data);
      setLoading(false);

      if (data.balance_paid) {
        router.push(`/session/${uuid}/pickup`);
      }
    };
    fetchSession();
  }, [uuid, router]);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((cfg) => {
        const pct = parseFloat(cfg?.card_surcharge_pct);
        if (!Number.isNaN(pct)) setSurchargePct(pct);
      })
      .catch(() => {
        // Keep the default; the server is authoritative at charge time.
      });
  }, []);

  const handleCardPayment = async (token: any) => {
    if (!token?.token) {
      setError('Card tokenization failed. Please try again.');
      return;
    }
    if (paying) return; // guard against a double submit
    setPaying(true);
    setError(null);
    try {
      // One key per attempt so Square treats a retry of this attempt as the
      // same charge rather than a second one.
      const idempotencyKey =
        globalThis.crypto?.randomUUID?.() ?? `${uuid}-${Date.now()}`;

      const res = await fetch(`/api/payments/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: uuid,
          source_id: token.token,
          idempotency_key: idempotencyKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Payment failed. Please try again.');
        setPaying(false);
        return;
      }
      router.push(`/session/${uuid}/pickup`);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setPaying(false);
    }
  };

  const handleCashCheck = async () => {
    await fetch(`/api/session/${uuid}/mark-cash-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    router.push(`/session/${uuid}/pickup`);
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!session) return <div className="text-center py-12">Session not found</div>;

  const balanceDue = session.balance_due || 0;
  const cardTotal = balanceDue * (1 + surchargePct / 100);

  return (
    <div className="min-h-screen bg-brand-warm">
      {/* Dark hero header */}
      <div className="bg-brand-dark px-4 pt-12 pb-16 text-center relative overflow-hidden">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

        <div className="relative z-10">
          {/* White logo */}
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
            Hi {session?.customer?.name?.split(' ')[0]},
          </p>

          {/* Hero headline */}
          <h1 className="font-display font-black text-white mb-4"
            style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}>
            Your Balance is Due
          </h1>

          <p className="font-body text-white/70 text-base max-w-md mx-auto">
            Pay online now or bring cash/check to pickup.
          </p>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-2xl mx-auto px-4 mt-6 pb-16">

        {/* Balance summary card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-brand-orange">
          <p className="font-body text-brand-gray text-sm mb-2">Balance Due</p>
          <p className="font-display font-bold text-4xl text-brand-dark">
            ${balanceDue.toFixed(2)}
          </p>
        </div>

        {/* Payment Options */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-display font-bold text-brand-dark mb-4">Payment Method</h3>
          {/* Payment method selector */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                paymentMethod === 'card'
                  ? 'border-[#E85D24] bg-[#FFF5F0]'
                  : 'border-[#E5E7EB] bg-white'
              }`}
            >
              <div className="text-xl mb-1">💳</div>
              <p className="text-xs font-semibold text-[#0F0F0F]">Credit/Debit Card</p>
              <p className="text-xs text-[#6B7280]">{surchargePct}% fee applies</p>
            </button>
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                paymentMethod === 'cash'
                  ? 'border-[#E85D24] bg-[#FFF5F0]'
                  : 'border-[#E5E7EB] bg-white'
              }`}
            >
              <div className="text-xl mb-1">💵</div>
              <p className="text-xs font-semibold text-[#0F0F0F]">Cash or Check</p>
              <p className="text-xs text-[#6B7280]">Pay at pickup</p>
            </button>
          </div>

          {paymentMethod === 'card' && (
            <div>
              <p className="text-sm text-[#6B7280] mb-3">
                Total with {surchargePct}% card fee: <strong className="text-[#0F0F0F]">
                  ${cardTotal.toFixed(2)}
                </strong>
              </p>
              <PaymentForm
                applicationId={process.env.NEXT_PUBLIC_SQUARE_APP_ID!}
                locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!}
                cardTokenizeResponseReceived={handleCardPayment}
              >
                <CreditCard
                  style={{
                    '.input-container': { borderColor: '#E5E7EB', borderRadius: '12px' },
                    '.input-container.is-focus': { borderColor: '#E85D24' },
                    '.input-container.is-error': { borderColor: '#EF4444' },
                    input: { color: '#111827', fontSize: '15px' },
                  }}
                >
                  {paying ? 'Processing…' : `Pay $${cardTotal.toFixed(2)}`}
                </CreditCard>
              </PaymentForm>
              {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
            </div>
          )}

          {paymentMethod === 'cash' && (
            <div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 mb-4">
                <p className="font-semibold mb-1">Cash or Check at Pickup</p>
                <p>Make checks payable to Legacy Land & Cattle. Bring exact amount to pickup.</p>
              </div>
              <button
                onClick={handleCashCheck}
                className="w-full bg-[#E85D24] text-white py-3 rounded-lg font-semibold hover:opacity-90"
              >
                Confirm — I'll Pay at Pickup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
