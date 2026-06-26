'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AccessPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAccess(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not verify your email.');
        return;
      }
      // Fetch session status to determine correct redirect
      try {
        const sessionRes = await fetch(`/api/session/${sessionId}`);
        const sessionData = await sessionRes.json();
        const status = sessionData?.status || '';
        const hasBalance = sessionData?.hanging_weight_lbs && !sessionData?.balance_paid;
        if (status === 'beef_ready') {
          router.push(`/session/${sessionId}/pickup`);
        } else if (status === 'locked' && hasBalance) {
          router.push(`/session/${sessionId}/balance`);
        } else if (status === 'locked') {
          router.push(`/session/${sessionId}/review`);
        } else {
          router.push(`/session/${sessionId}/cuts`);
        }
      } catch {
        router.push(`/session/${sessionId}/cuts`);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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

          {/* Hero headline */}
          <h1 className="font-display font-black text-white mb-3"
            style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}>
            Welcome Back
          </h1>

          <p className="font-body text-white/70 text-base max-w-sm mx-auto">
            Enter your email to access your beef reservation.
          </p>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-sm mx-auto px-4 mt-6 pb-16">
        <form onSubmit={handleAccess} className="bg-white rounded-2xl shadow-lg p-8">
          <label className="block font-body font-semibold text-brand-dark mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full border-2 border-brand-gray-light rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange font-body text-brand-dark"
            disabled={loading}
            required
          />

          {error && (
            <p className="text-red-500 text-sm mt-2 font-body">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-4 rounded-xl font-body font-bold text-lg mt-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </>
            ) : (
              'Access My Reservation'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-brand-gray mt-4">
          Need help? Call Grant at <a href="tel:7192581777" className="text-brand-orange">719.258.1777</a>
        </p>
      </div>
    </div>
  );
}
