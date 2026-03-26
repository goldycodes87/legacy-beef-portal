'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message || 'Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold text-brand-green leading-tight">
            Legacy Land & Cattle
          </h1>
          <p className="text-sm text-gray-500 mt-1 tracking-wide uppercase">
            Customer Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8">
          {submitted ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-xl font-serif font-bold text-brand-green mb-2">
                Check your email
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                We sent a magic link to{' '}
                <strong className="text-gray-800 break-all">{email}</strong>.
                Click it to access your order — no password needed.
              </p>
              <p className="text-xs text-gray-400 mt-4">
                Didn&apos;t get it? Check your spam folder, or{' '}
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-brand-green underline"
                >
                  try again
                </button>
                .
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-serif font-bold text-brand-green mb-1">
                Access Your Order
              </h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Enter your email to receive a magic link — click it to view your
                beef order, cut sheet, and status.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    inputMode="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 text-base rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green transition-colors placeholder:text-gray-400"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-brand-green text-white font-semibold py-3.5 rounded-xl text-base active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending link...' : 'Send Magic Link →'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Help link */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Need help?{' '}
          <a
            href="tel:+17195550100"
            className="text-brand-green underline"
          >
            Call Grant at (719) 555-0100
          </a>
        </p>
      </div>
    </main>
  );
}
