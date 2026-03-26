'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
interface SlotWithAnimal {
  id: string;
  animal_id: string;
  slot_type: 'whole' | 'half_a' | 'half_b';
  status: 'available' | 'booked' | 'processing';
  customer_id: string | null;
  created_at: string;
  animal: {
    id: string;
    name: string;
    type: string;
    butcher_date: string;
    estimated_ready_date: string;
    hanging_weight_lbs: number;
    price_per_lb: number;
    status: string;
    created_at: string;
  };
}

const slotTypeLabel = (type: string) => {
  switch (type) {
    case 'whole': return 'Whole Beef';
    case 'half_a': return 'Half Beef (Side A)';
    case 'half_b': return 'Half Beef (Side B)';
    default: return type;
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function BookPage() {
  const [slots, setSlots] = useState<SlotWithAnimal[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotWithAnimal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const res = await fetch('/api/slots');
      if (!res.ok) throw new Error('Failed to load slots');
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      setError('Unable to load available slots. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select a slot before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          slot_id: selectedSlot.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');

      setSessionId(data.session_id);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success && sessionId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full card text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-serif font-bold text-brand-green mb-3">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you, <strong>{form.name}</strong>! Check your email for your magic link
            — click it to access your order. We sent it to{' '}
            <strong>{form.email}</strong>.
          </p>
          <Link href={`/session/${sessionId}`} className="btn-primary w-full text-center">
            View Your Order →
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            Check your email for your magic link — click it to access your order.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-sm text-brand-green hover:underline mb-4 inline-block">
            ← Legacy Land & Cattle
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-green">
            Reserve Your Beef
          </h1>
          <p className="text-gray-600 mt-2">
            Select an available slot and fill in your details to lock in your order.
          </p>
        </div>

        {/* Available Slots */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Available Slots
          </h2>

          {loading && (
            <div className="card text-center py-10 text-gray-500">
              Loading available slots...
            </div>
          )}

          {!loading && slots.length === 0 && (
            <div className="card text-center py-10">
              <p className="text-gray-500">No slots available at this time.</p>
              <p className="text-sm text-gray-400 mt-2">
                Check back soon or contact us to be added to the waitlist.
              </p>
            </div>
          )}

          {!loading && slots.length > 0 && (
            <div className="space-y-3">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={`w-full text-left card transition-all duration-150 cursor-pointer ${
                    selectedSlot?.id === slot.id
                      ? 'border-2 border-brand-green ring-2 ring-brand-green/20'
                      : 'hover:border-brand-green/50 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-brand-green">
                          {slot.animal.name}
                        </span>
                        <span className="text-xs bg-brand-tan/20 text-brand-brown px-2 py-0.5 rounded-full font-medium">
                          {slotTypeLabel(slot.slot_type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Butcher date: <strong>{formatDate(slot.animal.butcher_date)}</strong>
                      </p>
                      <p className="text-sm text-gray-600">
                        Estimated ready: <strong>{formatDate(slot.animal.estimated_ready_date)}</strong>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        ~{slot.animal.hanging_weight_lbs} lbs hanging weight
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-brand-green">
                        ${slot.animal.price_per_lb.toFixed(2)}
                        <span className="text-sm font-normal text-gray-500">/lb</span>
                      </p>
                      {selectedSlot?.id === slot.id && (
                        <span className="text-xs text-brand-green font-semibold">✓ Selected</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Booking Form */}
        {!loading && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Your Information
            </h2>
            <form onSubmit={handleSubmit} className="card space-y-4">
              <div>
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="form-input"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  We&apos;ll send your order confirmation and access link here.
                </p>
              </div>

              <div>
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  required
                  className="form-input"
                  placeholder="(555) 555-5555"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="address">Delivery / Pickup Address</label>
                <textarea
                  id="address"
                  required
                  className="form-input resize-none"
                  rows={2}
                  placeholder="123 Main St, Town, State, ZIP"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {!selectedSlot && slots.length > 0 && (
                <p className="text-amber-600 text-sm font-medium">
                  ↑ Please select a slot above before submitting.
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                className="btn-primary w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Reserving your slot...' : 'Reserve My Beef →'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                By reserving, you agree to the deposit and payment terms discussed with Legacy Land & Cattle.
              </p>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
