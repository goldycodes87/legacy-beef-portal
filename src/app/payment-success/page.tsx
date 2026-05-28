'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [paidAmount, setPaidAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    async function fetchAmount() {
      try {
        const res = await fetch('/api/payments/latest-deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await res.json();
        if (res.ok && data.amount_cents !== undefined && data.amount_cents !== null) {
          setPaidAmount(data.amount_cents / 100);
        }
      } catch (err) {
        console.error('Failed to load deposit amount', err);
      }
    }
    fetchAmount();
  }, [sessionId]);

  const amountText = paidAmount !== null
    ? `Your deposit of $${paidAmount.toFixed(2)} has been received and your beef spot is locked in.`
    : 'Your deposit has been received and your beef spot is locked in.';

  return (
    <div className="min-h-screen bg-brand-warm">
      <PageHeader showBack={false} />

      <main className="max-w-[600px] mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-brand-dark mb-3">
            You&apos;re confirmed!
          </h1>
          <p className="font-body text-brand-gray text-base">
            {amountText}
          </p>
        </div>

        {/* Info Box */}
        <Card variant="dark" padding="md" className="mb-8">
          <p className="font-body text-center text-sm text-white">
            Check your email for your order confirmation and a link to return anytime.
          </p>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Link href={sessionId ? `/session/${sessionId}/cuts` : '/'}>
            <Button fullWidth size="lg">
              Start My Cut Sheet →
            </Button>
          </Link>

          <Link href="/">
            <Button variant="secondary" fullWidth size="lg">
              I&apos;ll Do It Later
            </Button>
          </Link>

          <p className="font-body text-center text-xs text-brand-gray mt-1">
            Check your email to return anytime
          </p>
        </div>
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-warm" />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
