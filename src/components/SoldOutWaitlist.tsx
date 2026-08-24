'use client';

import { useState } from 'react';

/**
 * Shown when every share on offer is claimed. The page used to render three
 * greyed-out "Sold Out" cards and nothing else, so every visitor hit a wall
 * with no next step.
 */
export default function SoldOutWaitlist({
  animalType = 'any',
}: {
  animalType?: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [size, setSize] = useState('any');
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('Please tell us your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Please enter a valid email address.');

    setState('saving');
    try {
      const res = await fetch('/api/wagyu-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          size_preference: size,
          animal_type: animalType,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'We could not save that. Please try again.');
        setState('idle');
        return;
      }
      setState('done');
    } catch {
      setError('We could not reach the server. Please try again, or call us.');
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-4xl mb-3" aria-hidden="true">✓</div>
        <h2 className="font-display font-bold text-2xl text-brand-dark mb-2">
          You&apos;re on the list, {name.split(' ')[0]}.
        </h2>
        <p className="font-body text-brand-gray text-sm leading-relaxed">
          We&apos;ll email you the moment the next butcher date opens — before it
          goes public. Questions in the meantime? Call{' '}
          <a href="tel:+17192581777" className="text-brand-orange font-semibold">
            (719) 258-1777
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
      <h2 className="font-display font-bold text-2xl text-brand-dark mb-2">
        This harvest is fully claimed
      </h2>
      <p className="font-body text-brand-gray text-sm leading-relaxed mb-6">
        Our shares sell out ahead of each butcher date. Leave your details and
        you&apos;ll hear about the next one first — no obligation, and we never
        share your information.
      </p>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label htmlFor="wl-name" className="block font-body text-sm font-semibold text-brand-dark mb-1">
            Name
          </label>
          <input
            id="wl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-2 border-brand-gray-light rounded-xl px-4 py-3 font-body text-brand-dark focus:outline-none focus:border-brand-orange"
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label htmlFor="wl-email" className="block font-body text-sm font-semibold text-brand-dark mb-1">
            Email
          </label>
          <input
            id="wl-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-2 border-brand-gray-light rounded-xl px-4 py-3 font-body text-brand-dark focus:outline-none focus:border-brand-orange"
            autoComplete="email"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="wl-phone" className="block font-body text-sm font-semibold text-brand-dark mb-1">
              Phone <span className="font-normal text-brand-gray">(optional)</span>
            </label>
            <input
              id="wl-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border-2 border-brand-gray-light rounded-xl px-4 py-3 font-body text-brand-dark focus:outline-none focus:border-brand-orange"
              autoComplete="tel"
            />
          </div>
          <div>
            <label htmlFor="wl-size" className="block font-body text-sm font-semibold text-brand-dark mb-1">
              Interested in
            </label>
            <select
              id="wl-size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full border-2 border-brand-gray-light rounded-xl px-4 py-3 font-body text-brand-dark bg-white focus:outline-none focus:border-brand-orange"
            >
              <option value="any">Not sure yet</option>
              <option value="whole">Whole beef</option>
              <option value="half">Half beef</option>
              <option value="quarter">Quarter beef</option>
            </select>
          </div>
        </div>

        {error && <p className="font-body text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={state === 'saving'}
          className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-lg py-4 rounded-xl transition-colors disabled:opacity-50"
        >
          {state === 'saving' ? 'Adding you…' : 'Tell me about the next date'}
        </button>
      </form>

      <p className="font-body text-center text-xs text-brand-gray mt-5">
        Prefer to talk it through?{' '}
        <a href="tel:+17192581777" className="text-brand-orange font-semibold">
          (719) 258-1777
        </a>
      </p>
    </div>
  );
}
