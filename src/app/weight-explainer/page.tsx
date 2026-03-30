'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import WeightExplainer from '@/components/WeightExplainer';
import ReservationProgress from '@/components/ReservationProgress';

export default function WeightExplainerPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  function handleContinue() {
    if (!checked) return;
    sessionStorage.setItem('weightExplainerComplete', 'true');
    router.push('/select-size');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Dark Header */}
      <header className="bg-brand-dark px-4 py-4 flex items-center">
        <Image
          src="/images/LLC_Logo.svg"
          alt="Legacy Land & Cattle"
          width={140}
          height={60}
          className="h-10 w-auto object-contain"
        />
      </header>

      <ReservationProgress currentStep="learn" />

      <main className="max-w-[700px] mx-auto px-4 py-10">

        {/* SECTION 1 — Page Heading */}
        <section className="mb-10 text-center">
          <h1
            className="text-3xl md:text-4xl font-bold text-brand-dark mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Know Your Beef Before You Buy
          </h1>
          <p className="text-brand-gray text-base leading-relaxed max-w-[560px] mx-auto">
            One of the most common surprises for first-time bulk beef buyers is yield. Here&apos;s exactly what to expect.
          </p>
        </section>

        {/* SECTION 2 — Interactive Weight Calculator */}
        <section className="mb-12">
          <WeightExplainer />
        </section>

        {/* PHASE 5 - ELEVENLABS VOICE ASSISTANT — narrates weight explainer on page load. Grant has ElevenLabs account. TODO: implement after core app stable. See elevenlabs.io/docs/conversational-ai */}

        {/* SECTION 3 — Freezer Video */}
        <section className="mb-12">
          <h2
            className="text-2xl font-bold text-brand-dark mb-3 text-center"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Will It Fit In My Freezer?
          </h2>
          <p className="text-brand-gray text-base mb-5 text-center">
            Watch this quick video to see exactly how much space your beef will take up.
          </p>
          <div className="flex justify-center">
            <video
              controls
              preload="metadata"
              poster="/images/hero_pasture.jpg"
              style={{ width: '100%', borderRadius: '12px', maxWidth: '750px' }}
            >
              <source src="/videos/Freezervideo.mp4" type="video/mp4" />
              Your browser does not support video playback.
            </video>
          </div>
        </section>

        {/* SECTION 4 — Key Info Card */}
        <section className="mb-10">
          <div
            className="rounded-xl p-6 text-white"
            style={{ backgroundColor: '#1A3D2B' }}
          >
            <h3
              className="text-lg font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              What You Need to Know
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-brand-orange"></span>
                <span className="text-sm leading-relaxed opacity-90">
                  Your final cost is based on <strong>HANGING weight</strong> — not live weight and not finished cuts
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-brand-orange"></span>
                <span className="text-sm leading-relaxed opacity-90">
                  Legacy Land &amp; Cattle will notify you of the exact hanging weight before your balance is due
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-brand-orange"></span>
                <span className="text-sm leading-relaxed opacity-90">
                  A chest freezer (7 cu ft) holds a quarter beef. A half needs ~14 cu ft.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-brand-orange"></span>
                <span className="text-sm leading-relaxed opacity-90">
                  Your beef is dry aged 21-24 days for maximum tenderness and flavor — this process reduces yield slightly but dramatically improves quality.
                </span>
              </li>
            </ul>
          </div>
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
                    ? 'bg-brand-green border-brand-green'
                    : 'bg-white border-brand-gray group-hover:border-brand-green'
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
            <span className="text-sm text-brand-dark leading-relaxed">
              I understand that my final price is based on hanging weight and will vary based on animal size.
            </span>
          </label>

          {/* CTA Button */}
          <button
            onClick={handleContinue}
            disabled={!checked}
            className={`
              w-full min-h-[48px] rounded-xl font-semibold text-base transition-colors duration-150
              ${checked
                ? 'text-white cursor-pointer'
                : 'bg-brand-gray-light text-brand-gray cursor-not-allowed'
              }
            `}
            style={checked ? { backgroundColor: '#E85D24' } : undefined}
          >
            I Understand — Choose My Beef →
          </button>
        </section>
      </main>
    </div>
  );
}
