'use client';

import { useState } from 'react';
import Image from 'next/image';

type SizeOption = 'whole' | 'half' | 'quarter';

const SIZE_OPTIONS: { id: SizeOption; label: string; deposit: string }[] = [
  { id: 'whole', label: 'Whole', deposit: '$850 deposit' },
  { id: 'half', label: 'Half', deposit: '$500 deposit' },
  { id: 'quarter', label: 'Quarter', deposit: '$250 deposit' },
];

export default function WagyuWaitlistPage() {
  const [form, setForm] = useState({
    customer_name: '',
    email: '',
    phone: '',
    size_preference: '' as SizeOption | '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer_name || !form.email || !form.size_preference) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/wagyu-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-brand-dark px-4 py-4 flex items-center">
          <Image
            src="/images/LLC_Logo.svg"
            alt="Legacy Land & Cattle"
            width={140}
            height={60}
            className="h-10 w-auto object-contain"
          />
        </header>
        <main className="max-w-[640px] mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1
            className="text-3xl font-bold text-brand-dark mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            You&apos;re on the list!
          </h1>
          <p className="text-brand-gray text-lg">
            We&apos;ll reach out when your Wagyu slot is available.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Dark Header */}
      <header className="bg-brand-dark px-4 py-4 flex items-center">
        <Image
          src="/images/LLC_Logo.svg"
          alt="Legacy Land & Cattle"
          width={140}
          height={60}
          className="h-10 w-auto object-contain"
        />
      </header>

      <main className="max-w-[640px] mx-auto px-4 py-10">
        <h1
          className="text-3xl md:text-4xl font-bold text-brand-dark mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Reserve Your Wagyu
        </h1>
        <p className="text-brand-gray mb-8 text-base">
          We source Wagyu in limited quantities. Join the waitlist and we&apos;ll contact you when your slot is ready.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1.5" htmlFor="name">
              Full Name <span className="text-brand-orange">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              placeholder="Jane Smith"
              className="w-full border border-brand-gray-light rounded-xl px-4 py-3 text-brand-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1.5" htmlFor="email">
              Email <span className="text-brand-orange">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jane@example.com"
              className="w-full border border-brand-gray-light rounded-xl px-4 py-3 text-brand-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1.5" htmlFor="phone">
              Phone <span className="text-brand-gray text-xs">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(555) 123-4567"
              className="w-full border border-brand-gray-light rounded-xl px-4 py-3 text-brand-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
            />
          </div>

          {/* Size preference */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-3">
              Size <span className="text-brand-orange">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {SIZE_OPTIONS.map((opt) => {
                const isSelected = form.size_preference === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setForm({ ...form, size_preference: opt.id })}
                    className={`
                      relative text-center rounded-xl border-2 p-4 transition-all duration-150 focus:outline-none
                      focus:ring-2 focus:ring-brand-orange focus:ring-offset-2
                      ${isSelected
                        ? 'border-brand-orange bg-[#FFF5F0]'
                        : 'border-brand-gray-light bg-white hover:border-brand-orange'
                      }
                    `}
                  >
                    <div className="font-semibold text-brand-dark text-sm">{opt.label}</div>
                    <div className="text-xs text-brand-gray mt-1">{opt.deposit}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !form.customer_name || !form.email || !form.size_preference}
            className={`
              w-full min-h-[48px] rounded-xl font-semibold text-base transition-colors duration-150
              ${(!submitting && form.customer_name && form.email && form.size_preference)
                ? 'bg-brand-orange hover:bg-brand-orange-hover text-white cursor-pointer'
                : 'bg-brand-gray-light text-brand-gray cursor-not-allowed'
              }
            `}
          >
            {submitting ? 'Joining...' : 'Join the Waitlist'}
          </button>
        </form>
      </main>
    </div>
  );
}
