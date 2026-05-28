'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BalancePage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

          <div className="space-y-3">
            <div className="p-4 border-2 rounded-lg border-[#e5e7eb] bg-gray-50">
              <p className="font-semibold text-brand-dark">Pay at Pickup</p>
              <p className="text-sm text-brand-gray">Cash or check accepted for ${balanceDue.toFixed(2)}.</p>
            </div>
            <button
              onClick={() => handleCashCheck()}
              className="w-full mt-2 bg-brand-orange text-white py-3 rounded-lg font-semibold hover:opacity-90"
            >
              Confirm Cash/Check Payment at Pickup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
