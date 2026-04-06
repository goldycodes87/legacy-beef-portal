'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Reservation {
  owner_name: string;
  animal_name: string;
  butcher_date: string;
  purchase_type: string;
  deposit_amount: number;
  price_per_lb: number;
  is_expired: boolean;
  is_claimed: boolean;
}

export default function JoinPage({ params }: { params: Promise<{ group_id: string }> }) {
  const router = useRouter();
  const [groupId, setGroupId] = useState<string>('');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'CO',
    zip: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    params.then(({ group_id }) => {
      setGroupId(group_id);
      fetch(`/api/join/${group_id}`)
        .then((res) => res.json())
        .then((data) => {
          setReservation(data);
          setLoading(false);
        });
    });
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch(`/api/join/${groupId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const { session_id } = await res.json();
      sessionStorage.setItem('sessionId', session_id);
      router.push('/contract');
    } else {
      alert('Failed to claim spot');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  if (!reservation) return <div className="text-center py-12">Invitation not found</div>;

  if (reservation.is_expired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
          <p className="text-red-700 font-semibold mb-3">This invitation has expired.</p>
          <p className="text-red-600 text-sm mb-4">
            Contact {reservation.owner_name} to request a new invitation, or reach out to us.
          </p>
          <a href="mailto:orders@legacylandandcattleco.com" className="text-red-700 underline">
            orders@legacylandandcattleco.com
          </a>
        </div>
      </div>
    );
  }

  if (reservation.is_claimed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 max-w-md">
          <p className="text-amber-700 font-semibold mb-3">This spot has already been claimed.</p>
          <p className="text-amber-600 text-sm">
            Contact {reservation.owner_name} or reach out to us for details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-2xl mx-auto py-12">
        
        {/* Reservation Summary */}
        <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{reservation.owner_name}&apos;s Beef Reservation</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Animal</p>
              <p className="font-semibold text-gray-900">{reservation.animal_name}</p>
            </div>
            <div>
              <p className="text-gray-600">Butcher Date</p>
              <p className="font-semibold text-gray-900">{new Date(reservation.butcher_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Type</p>
              <p className="font-semibold text-gray-900 capitalize">{reservation.purchase_type}</p>
            </div>
            <div>
              <p className="text-gray-600">Your Deposit</p>
              <p className="font-semibold text-green-600">${reservation.deposit_amount}</p>
            </div>
            <div>
              <p className="text-gray-600">Price</p>
              <p className="font-semibold text-gray-900">${reservation.price_per_lb.toFixed(2)}/lb</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Claim Your Spot</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="tel"
              placeholder="Phone"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="text"
              placeholder="Address"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="City"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="text"
                placeholder="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <input
              type="text"
              placeholder="ZIP"
              required
              value={formData.zip}
              onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50"
            >
              {submitting ? 'Claiming...' : 'Claim My Spot'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
