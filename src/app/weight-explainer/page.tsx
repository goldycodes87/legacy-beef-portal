'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import WeightExplainer from '@/components/WeightExplainer';
import ReservationProgress from '@/components/ReservationProgress';
import BeefCalculator from '@/components/BeefCalculator';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Timeline } from '@/components/ui/modern-timeline';

export default function WeightExplainerPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  function handleContinue() {
    if (!checked) return;
    sessionStorage.setItem('weightExplainerComplete', 'true');
    router.push('/select-size');
  }

  return (
    <div className="min-h-screen bg-brand-warm">
      <PageHeader showBack={true} currentStep={1} totalSteps={6} />

      <ReservationProgress currentStep="learn" />

      <main className="max-w-[700px] mx-auto px-4 py-10">

        {/* SECTION 1 — Page Heading */}
        <section className="mb-10 text-center">
          <h1 className="font-display font-bold text-3xl md:text-4xl text-brand-dark mb-4">
            Know Your Beef Before You Buy
          </h1>
          <p className="font-body text-brand-gray text-base leading-relaxed max-w-[560px] mx-auto">
            One of the most common surprises for first-time bulk beef buyers is yield. Here&apos;s exactly what to expect.
          </p>
        </section>

        {/* SECTION 2 — Weight Explainer */}
        <section className="mb-12">
          <div className="overflow-x-auto max-w-full">
            <WeightExplainer />
          </div>
        </section>

        {/* SECTION 3 — Beef Calculator */}
        <section className="mb-12">
          <h2 className="font-display font-bold text-2xl text-brand-dark mb-2 text-center">
            Not sure how much you need?
          </h2>
          <p className="font-body text-brand-gray text-sm text-center mb-4">
            Tell us about your household and we'll recommend the right size.
          </p>
          <BeefCalculator />
        </section>

        {/* SECTION 4 — Freezer Video */}
        <section className="mb-12">
          <h2 className="font-display font-bold text-2xl text-brand-dark mb-3 text-center">
            Will It Fit In My Freezer?
          </h2>
          <p className="font-body text-brand-gray text-base mb-5 text-center">
            Watch this quick video to see exactly how much space your beef will take up.
          </p>
          <div className="flex justify-center">
            <video
              controls
              preload="metadata"
              poster="/images/hero_pasture.jpg"
              className="w-full max-w-[750px]"
              style={{ borderRadius: '12px' }}
            >
              <source src="/videos/Freezervideo.mp4" type="video/mp4" />
              Your browser does not support video playback.
            </video>
          </div>
        </section>

        {/* SECTION 5 — Beef Journey Timeline */}
        <section className="mb-10">
          <h2 className="font-display font-bold text-2xl text-brand-dark text-center mb-2">
            Your Beef Journey
          </h2>
          <p className="font-body text-brand-gray text-center text-sm mb-6">
            From our ranch to your freezer — here's exactly what happens.
          </p>
          <Timeline items={[
            {
              icon: '🐄',
              title: 'Reserve Your Spot',
              date: 'Day 1',
              description: 'Pay your deposit to lock in your slot. Choose your size — whole, half, or quarter. Your price per pound is set at this point.',
            },
            {
              icon: '✂️',
              title: 'Fill Out Your Cut Sheet',
              date: 'Before butcher date',
              description: 'Tell the butcher exactly how you want your beef cut — steak thickness, roast size, ground beef ratio, and more. You have until 1 week before butcher day.',
            },
            {
              icon: '🚛',
              title: 'We Transport to T-K Processing',
              date: 'Butcher day',
              description: 'We transport the cattle to T-K Processing in Cañon City and drop off your cut sheet in person. You don\'t lift a finger.',
            },
            {
              icon: '🥩',
              title: 'Dry Age 21–24 Days',
              date: '3 weeks later',
              description: 'Your beef is dry-aged for 21–24 days for maximum tenderness and flavor. During this time, yield reduces slightly — this is normal and expected.',
            },
            {
              icon: '📦',
              title: 'Cut, Vacuum-Sealed & Labeled',
              date: 'After aging',
              description: 'Everything is cut to your specs, vacuum-sealed, and labeled. A half beef fills about 4 boxes. We pick it up and bring it back to the ranch.',
            },
            {
              icon: '❄️',
              title: 'You Pick It Up',
              date: 'Est. 4–5 weeks after butcher',
              description: 'Schedule your pickup at 6105 Burgess Rd, Colorado Springs CO 80908. Pay your remaining balance and load up. Your beef is frozen solid and ready to go.',
            },
          ]} />
        </section>

        {/* SECTION 6 — Checkbox + CTA */}
        <section className="mb-12">
          {/* Checkbox */}
          <label className="flex items-start gap-4 cursor-pointer mb-6 group">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  checked
                    ? 'bg-brand-orange border-brand-orange'
                    : 'bg-white border-brand-gray group-hover:border-brand-orange'
                }`}
                style={{ minWidth: '24px', minHeight: '24px' }}
              >
                {checked && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="font-body text-sm text-brand-dark leading-relaxed">
              I understand that my final price is based on hanging weight and will vary based on animal size.
            </span>
          </label>

          {/* CTA Button */}
          <Button
            onClick={handleContinue}
            disabled={!checked}
            fullWidth
            size="lg"
          >
            I Understand — Choose My Beef →
          </Button>
        </section>
      </main>
    </div>
  );
}
