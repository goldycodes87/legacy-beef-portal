'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const router = useRouter();

  function handleStartCutSheet() {
    if (sessionId) {
      router.push(`/session/${sessionId}`);
    }
  }

  function handleDoItLater() {
    router.push('/');
  }

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
            Your deposit has been received and your beef spot is locked in.
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
          <Button onClick={handleStartCutSheet} fullWidth size="lg">
            Start My Cut Sheet →
          </Button>

          <Button onClick={handleDoItLater} variant="secondary" fullWidth size="lg">
            I&apos;ll Do It Later
          </Button>

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
