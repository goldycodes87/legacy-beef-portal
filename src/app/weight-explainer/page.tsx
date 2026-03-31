'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import WeightExplainer from '@/components/WeightExplainer';
import ReservationProgress from '@/components/ReservationProgress';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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

        {/* SECTION 2 + 3 — Calculator and Video */}
        <section className="mb-12">
          <div className="flex flex-col gap-8 w-full">
            {/* Interactive Weight Calculator */}
            <div className="overflow-x-auto max-w-full flex-1">
              <WeightExplainer />
            </div>

            {/* Freezer Video */}
            <div className="flex-1">
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
            </div>
          </div>
        </section>

        {/* SECTION 4 — Key Info Card */}
        <section className="mb-10">
          <Card variant="dark" padding="md">
            <h3 className="font-display font-bold text-lg text-white mb-4">
              What You Need to Know
            </h3>
            <ul className="space-y-3">
              {[
                'Your final cost is based on <strong>HANGING weight</strong> — not live weight and not finished cuts',
                'Legacy Land &amp; Cattle will notify you of the exact hanging weight before your balance is due',
                'A chest freezer (7 cu ft) holds a quarter beef. A half needs ~14 cu ft.',
                'Your beef is dry aged 21-24 days for maximum tenderness and flavor — this process reduces yield slightly but dramatically improves quality.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-brand-orange" />
                  <span
                    className="font-body text-sm leading-relaxed text-white/90"
                    dangerouslySetInnerHTML={{ __html: item }}
                  />
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* SECTION 5 — Checkbox + CTA */}
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
