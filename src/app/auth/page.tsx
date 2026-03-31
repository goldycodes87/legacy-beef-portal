'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InfoBox } from '@/components/ui/InfoBox';

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
    <div className="min-h-screen bg-brand-warm">
      <PageHeader showBack={true} />

      <main className="flex flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          {/* Logo / Branding */}
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-2xl text-brand-dark leading-tight">
              Legacy Land &amp; Cattle
            </h1>
            <p className="font-body text-sm text-brand-gray mt-1 tracking-wide uppercase">
              Customer Portal
            </p>
          </div>

          <Card variant="default" padding="md">
            {submitted ? (
              <div className="text-center">
                <div className="text-4xl mb-4">📬</div>
                <h2 className="font-display font-bold text-xl text-brand-dark mb-2">
                  Check your email
                </h2>
                <p className="font-body text-brand-gray text-sm leading-relaxed">
                  We sent a magic link to{' '}
                  <strong className="text-brand-dark break-all">{email}</strong>.
                  Click it to access your order — no password needed.
                </p>
                <p className="font-body text-xs text-brand-gray mt-4">
                  Didn&apos;t get it? Check your spam folder, or{' '}
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-brand-orange underline"
                  >
                    try again
                  </button>
                  .
                </p>
              </div>
            ) : (
              <>
                <h2 className="font-display font-bold text-xl text-brand-dark mb-1">
                  Access Your Order
                </h2>
                <p className="font-body text-sm text-brand-gray mb-6 leading-relaxed">
                  Enter your email to receive a magic link — click it to view your
                  beef order, cut sheet, and status.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block font-body text-sm font-medium text-brand-dark mb-1.5"
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
                      className="w-full px-4 py-3 font-body text-base rounded-xl border border-brand-gray-light bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange transition-colors placeholder:text-brand-gray"
                    />
                  </div>

                  {error && (
                    <InfoBox variant="warning" title="Error">
                      {error}
                    </InfoBox>
                  )}

                  <Button
                    type="submit"
                    loading={loading}
                    disabled={!email}
                    fullWidth
                  >
                    {loading ? 'Sending link...' : 'Send Magic Link →'}
                  </Button>
                </form>
              </>
            )}
          </Card>

          {/* Help link */}
          <p className="font-body text-center text-sm text-brand-gray mt-6">
            Need help?{' '}
            <a
              href="tel:+17195550100"
              className="text-brand-orange underline"
            >
              Call Grant at (719) 555-0100
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
