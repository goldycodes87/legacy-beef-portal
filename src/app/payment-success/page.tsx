'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

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
    <div className="min-h-screen bg-[#F5F0E8]">
      <header className="bg-[#0F0F0F] px-4 py-4 flex items-center sticky top-0 z-10">
        <Image
          src="/images/LLC_Logo.svg"
          alt="Legacy Land & Cattle"
          width={140}
          height={60}
          className="h-10 w-auto object-contain"
        />
      </header>

      <main className="max-w-[600px] mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎉</div>
          <h1
            className="text-3xl md:text-4xl font-bold text-[#0F0F0F] mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            You&apos;re confirmed!
          </h1>
          <p className="text-[#6B7280] text-base">
            Your deposit has been received and your beef spot is locked in.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-[#2D5016] text-white rounded-2xl p-6 mb-8">
          <p className="text-center text-sm">
            Check your email for your order confirmation and a link to return anytime.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleStartCutSheet}
            className="w-full py-4 px-6 rounded-xl text-white font-semibold text-base transition-colors"
            style={{ backgroundColor: '#E85D24' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D14E1A')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E85D24')}
          >
            Start My Cut Sheet →
          </button>

          <button
            onClick={handleDoItLater}
            className="w-full py-4 px-6 rounded-xl font-semibold text-base border-2 border-[#6B7280] text-[#6B7280] bg-white hover:border-[#0F0F0F] hover:text-[#0F0F0F] transition-colors"
          >
            I&apos;ll Do It Later
          </button>

          <p className="text-center text-xs text-[#6B7280] mt-1">
            Check your email to return anytime
          </p>
        </div>
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F0E8]" />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
