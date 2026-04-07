'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function BalancePage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;
  
  const [session, setSession] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(true);

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

  const handlePayCard = async () => {
    const res = await fetch('/api/payments/create-balance-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: uuid }),
    });
    const { client_secret } = await res.json();
    // TODO: Launch Stripe modal with client_secret
  };

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
          className="h-14 w-auto"
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
            <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer" style={{borderColor: paymentMethod === 'card' ? '#E85D24' : '#e5e7eb'}}>
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

            <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer" style={{borderColor: paymentMethod === 'check' ? '#E85D24' : '#e5e7eb'}}>
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

          <button
            onClick={() => paymentMethod === 'card' ? handlePayCard() : router.push(`/session/${uuid}`)}
            className="w-full mt-6 bg-brand-orange text-white py-3 rounded-lg font-semibold hover:opacity-90"
          >
            {paymentMethod === 'card' ? `Pay $${balanceDue.toFixed(2)} Now` : 'Continue to Pickup'}
          </button>
        </div>
      </div>
    </div>
  );
}
