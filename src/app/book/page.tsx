'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slot {
  id: string;
  name: string;
  animal_type: string;
  butcher_date: string | null;
  estimated_ready_date: string | null;
  price_per_lb: number;
  hanging_weight_lbs: number | null;
  spots_remaining: number;
  deposit_amount: number;
  est_total_low: number;
  est_total_high: number;
  purchase_type: string;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function animalTypeLabel(type: string): string {
  switch (type) {
    case 'grass_fed':      return 'Grass-Fed';
    case 'grain_finished': return 'Grain-Finished';
    case 'wagyu':          return 'Wagyu';
    default:               return type;
  }
}

function purchaseTypeLabel(type: string): string {
  switch (type) {
    case 'whole':   return 'Whole Beef';
    case 'half':    return 'Half Beef';
    case 'quarter': return 'Quarter Beef';
    default:        return type;
  }
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 10;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookPage() {
  const router = useRouter();

  // Guard state (from sessionStorage)
  const [guardPassed, setGuardPassed] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [animalType, setAnimalType] = useState<string>('no_preference');

  // Slots
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Form
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', address: '' });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successSessionId, setSuccessSessionId] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  // ── Guard: check sessionStorage on mount ──────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const size = sessionStorage.getItem('selectedSize') || '';
    const aType = sessionStorage.getItem('animalTypePreference') || 'no_preference';

    if (!size) {
      // Redirect back to start of funnel
      router.replace('/select-size');
      return;
    }

    setSelectedSize(size);
    setAnimalType(aType);
    setGuardPassed(true);
  }, [router]);

  // ── Fetch slots once guard passes ──────────────────────────────────────────
  useEffect(() => {
    if (!guardPassed || !selectedSize) return;

    setSlotsLoading(true);
    setSlotsError(null);

    const params = new URLSearchParams({
      animalType:   animalType,
      purchaseType: selectedSize,
    });

    fetch(`/api/slots?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load slots');
        return r.json();
      })
      .then((data) => {
        setSlots(data.slots || []);
        setSlotsLoading(false);
      })
      .catch(() => {
        setSlotsError('Unable to load available slots. Please try again.');
        setSlotsLoading(false);
      });
  }, [guardPassed, selectedSize, animalType]);

  // ── Inline validation ──────────────────────────────────────────────────────
  function validate(fields: FormState): FormErrors {
    const errors: FormErrors = {};
    if (!fields.name.trim()) errors.name = 'Full name is required.';
    if (!fields.email.trim()) errors.email = 'Email address is required.';
    else if (!validateEmail(fields.email)) errors.email = 'Enter a valid email address.';
    if (!fields.phone.trim()) errors.phone = 'Phone number is required.';
    else if (!validatePhone(fields.phone)) errors.phone = 'Enter a valid 10-digit phone number.';
    if (!fields.address.trim()) errors.address = 'Address is required.';
    return errors;
  }

  function handleBlur(field: keyof FormState) {
    setTouched((t) => ({ ...t, [field]: true }));
    const errs = validate(form);
    setFieldErrors(errs);
  }

  function handleChange(field: keyof FormState, value: string) {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) {
      setFieldErrors(validate(updated));
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Mark all fields touched
    setTouched({ name: true, email: true, phone: true, address: true });
    const errs = validate(form);
    setFieldErrors(errs);

    if (Object.keys(errs).length > 0) return;
    if (!selectedSlot) {
      setSubmitError('Please select a slot above before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          form.name,
          email:         form.email,
          phone:         form.phone,
          address:       form.address,
          animal_id:     selectedSlot.id,
          purchase_type: selectedSize,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed. Please try again.');

      // Clear sessionStorage funnel data
      sessionStorage.removeItem('selectedSize');
      sessionStorage.removeItem('animalTypePreference');
      sessionStorage.removeItem('isSplitting');
      sessionStorage.removeItem('partnerEmails');

      setSuccessSessionId(data.session_id);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (successSessionId) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-brand-dark px-4 py-4 flex items-center">
          <Image src="/images/LLC_Logo.svg" alt="Legacy Land &amp; Cattle" width={140} height={60} className="h-10 w-auto object-contain" />
        </header>
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-brand-dark mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Order Confirmed!
          </h1>
          <p className="text-brand-gray mb-2">
            Thanks, <strong>{form.name.split(' ')[0]}</strong>! Your beef slot is reserved.
          </p>
          <p className="text-brand-gray mb-8">
            A confirmation email is on its way to <strong>{form.email}</strong>.
          </p>
          <a
            href={`/session/${successSessionId}`}
            className="inline-block w-full max-w-xs bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold py-4 rounded-xl text-center transition-colors duration-150"
          >
            View Your Order →
          </a>
          <p className="mt-4 text-sm text-brand-gray">
            Check your email for confirmation details and next steps.
          </p>
        </main>
      </div>
    );
  }

  // ── Guard not yet confirmed (redirecting) ──────────────────────────────────
  if (!guardPassed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Main page ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-brand-dark px-4 py-4 flex items-center">
        <Image src="/images/LLC_Logo.svg" alt="Legacy Land &amp; Cattle" width={140} height={60} className="h-10 w-auto object-contain" />
      </header>

      <main className="max-w-[680px] mx-auto px-4 py-10">

        {/* ── Section 1: Page heading ── */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-sm text-brand-orange hover:underline mb-4 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-dark mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Reserve Your Beef
          </h1>
          <p className="text-brand-gray text-base">
            Select an available animal and lock in your order.
          </p>
        </div>

        {/* ── Section 2: Selection summary card ── */}
        <div className="bg-[#F5F0E8] border border-[#E8DCC8] rounded-2xl px-5 py-4 mb-8 flex items-center gap-4">
          <div className="text-3xl">🐄</div>
          <div className="flex-1">
            <p className="text-xs text-brand-gray uppercase tracking-widest font-semibold mb-0.5">Your Selection</p>
            <p className="text-brand-dark font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              {purchaseTypeLabel(selectedSize)}
            </p>
            {animalType && animalType !== 'no_preference' && (
              <p className="text-sm text-brand-gray">{animalTypeLabel(animalType)}</p>
            )}
          </div>
          <button
            onClick={() => router.replace('/select-size')}
            className="text-sm text-brand-orange hover:underline font-medium"
          >
            Change
          </button>
        </div>

        {/* ── Section 3: Slot cards ── */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-brand-dark mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Available Animals
          </h2>

          {slotsLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!slotsLoading && slotsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm">
              {slotsError}
              <button
                onClick={() => {
                  setSlotsError(null);
                  setSlotsLoading(true);
                  const params = new URLSearchParams({ animalType, purchaseType: selectedSize });
                  fetch(`/api/slots?${params}`)
                    .then((r) => r.json())
                    .then((d) => { setSlots(d.slots || []); setSlotsLoading(false); })
                    .catch(() => { setSlotsError('Still unable to load. Please refresh.'); setSlotsLoading(false); });
                }}
                className="ml-3 underline font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {!slotsLoading && !slotsError && slots.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-[#E5E7EB] rounded-2xl">
              <p className="text-brand-dark font-semibold mb-1">No slots available right now</p>
              <p className="text-sm text-brand-gray mb-4">
                We&apos;re sold out for your selection. Check back soon or adjust your size.
              </p>
              <button
                onClick={() => router.replace('/select-size')}
                className="text-brand-orange hover:underline text-sm font-medium"
              >
                ← Change my size
              </button>
            </div>
          )}

          {!slotsLoading && !slotsError && slots.length > 0 && (
            <div className="space-y-3">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id;
                const lowStock = slot.spots_remaining === 1;
                return (
                  <button
                    key={slot.id}
                    onClick={() => {
                      setSelectedSlot(isSelected ? null : slot);
                      // Scroll to form
                      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
                    }}
                    aria-pressed={isSelected}
                    className={`
                      w-full text-left rounded-2xl border-2 p-5 transition-all duration-150
                      focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2
                      ${isSelected
                        ? 'border-brand-orange bg-[#FFF5F0] shadow-md'
                        : 'border-[#E5E7EB] bg-white hover:border-brand-orange/50 hover:shadow-sm'
                      }
                    `}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-brand-dark text-base" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {slot.name}
                          </span>
                          {slot.animal_type && slot.animal_type !== 'no_preference' && (
                            <span className="text-xs bg-[#F5F0E8] text-brand-gray px-2.5 py-0.5 rounded-full font-medium">
                              {animalTypeLabel(slot.animal_type)}
                            </span>
                          )}
                        </div>

                        {/* Amber warning: 1 spot left */}
                        {lowStock && (
                          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
                            <span>⚠️</span> Only 1 spot left!
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-brand-gray mt-1">
                          {slot.butcher_date && (
                            <p><span className="font-medium text-brand-dark">Butcher:</span> {formatDate(slot.butcher_date)}</p>
                          )}
                          {slot.estimated_ready_date && (
                            <p><span className="font-medium text-brand-dark">Ready:</span> {formatDate(slot.estimated_ready_date)}</p>
                          )}
                          {slot.hanging_weight_lbs && (
                            <p><span className="font-medium text-brand-dark">Hanging wt:</span> ~{slot.hanging_weight_lbs} lbs</p>
                          )}
                          <p>
                            <span className="font-medium text-brand-dark">Est. total:</span>{' '}
                            ${slot.est_total_low.toLocaleString()}–${slot.est_total_high.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Price + select indicator */}
                      <div className="shrink-0 text-right">
                        <p className="text-2xl font-bold text-brand-dark">
                          ${slot.price_per_lb.toFixed(2)}
                          <span className="text-sm font-normal text-brand-gray">/lb</span>
                        </p>
                        <p className="text-xs text-brand-gray mt-0.5">${slot.deposit_amount} deposit</p>
                        {isSelected && (
                          <div className="mt-2 flex justify-end">
                            <div className="w-5 h-5 rounded-full bg-brand-orange flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Section 4: Contact form ── */}
        <section ref={formRef} className="mb-8">
          <h2 className="text-xl font-bold text-brand-dark mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Your Information
          </h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-brand-dark mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="Jane Smith"
                className={`
                  w-full border rounded-xl px-4 py-3 text-sm text-brand-dark
                  focus:outline-none focus:ring-2 focus:ring-brand-orange transition-colors
                  ${touched.name && fieldErrors.name ? 'border-red-400 bg-red-50' : 'border-[#E5E7EB]'}
                `}
              />
              {touched.name && fieldErrors.name && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-brand-dark mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="jane@example.com"
                className={`
                  w-full border rounded-xl px-4 py-3 text-sm text-brand-dark
                  focus:outline-none focus:ring-2 focus:ring-brand-orange transition-colors
                  ${touched.email && fieldErrors.email ? 'border-red-400 bg-red-50' : 'border-[#E5E7EB]'}
                `}
              />
              {touched.email && fieldErrors.email ? (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
              ) : (
                <p className="text-xs text-brand-gray mt-1">
                  Your order confirmation will be sent here.
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-brand-dark mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder="(555) 555-5555"
                className={`
                  w-full border rounded-xl px-4 py-3 text-sm text-brand-dark
                  focus:outline-none focus:ring-2 focus:ring-brand-orange transition-colors
                  ${touched.phone && fieldErrors.phone ? 'border-red-400 bg-red-50' : 'border-[#E5E7EB]'}
                `}
              />
              {touched.phone && fieldErrors.phone && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-brand-dark mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                autoComplete="street-address"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                onBlur={() => handleBlur('address')}
                placeholder="123 Main St, Town, State, ZIP"
                rows={2}
                className={`
                  w-full border rounded-xl px-4 py-3 text-sm text-brand-dark resize-none
                  focus:outline-none focus:ring-2 focus:ring-brand-orange transition-colors
                  ${touched.address && fieldErrors.address ? 'border-red-400 bg-red-50' : 'border-[#E5E7EB]'}
                `}
              />
              {touched.address && fieldErrors.address && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.address}</p>
              )}
            </div>

            {/* ── Section 5: Info box + CTA ── */}
            <div className="bg-[#F5F0E8] border border-[#E8DCC8] rounded-2xl px-5 py-4 text-sm text-brand-gray leading-relaxed">
              <p className="font-semibold text-brand-dark mb-1">What happens after you reserve?</p>
              <ul className="space-y-1 list-none pl-0">
                <li>✅ You&apos;ll receive a confirmation email immediately</li>
                <li>💳 We&apos;ll reach out with deposit payment details</li>
                <li>🔪 Build your custom cut sheet before butcher day</li>
                <li>📦 We notify you when your beef is ready for pickup</li>
              </ul>
            </div>

            {/* Slot selection reminder */}
            {!selectedSlot && !slotsLoading && slots.length > 0 && (
              <p className="text-amber-700 text-sm font-medium bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                ↑ Please select an animal above before submitting.
              </p>
            )}

            {/* Submit error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {submitError}
              </div>
            )}

            {/* CTA button */}
            <button
              type="submit"
              disabled={submitting || (!selectedSlot && slots.length > 0)}
              className={`
                w-full min-h-[52px] rounded-xl font-semibold text-base transition-colors duration-150
                ${!submitting && (selectedSlot || slots.length === 0)
                  ? 'bg-brand-orange hover:bg-brand-orange-hover text-white cursor-pointer'
                  : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                }
              `}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Reserving your slot…
                </span>
              ) : (
                'Reserve My Beef →'
              )}
            </button>

            <p className="text-xs text-center text-brand-gray">
              By reserving, you agree to our{' '}
              <a href="/contract" className="underline hover:text-brand-dark">terms and deposit policy</a>.
              No payment is collected on this page.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
