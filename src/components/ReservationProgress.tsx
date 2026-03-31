'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface ReservationProgressProps {
  currentStep?: 'learn' | 'choose' | 'info' | 'contract' | 'deposit' | 'cut-sheet';
}

const STEPS = [
  { key: 'learn', label: 'Learn', number: 1 },
  { key: 'choose', label: 'Choose', number: 2 },
  { key: 'info', label: 'Your Info', number: 3 },
  { key: 'contract', label: 'Contract', number: 4 },
  { key: 'deposit', label: 'Deposit', number: 5 },
  { key: 'cut-sheet', label: 'Cut Sheet', number: 6 },
];

const stepRoutes: Record<string, string> = {
  learn: '/weight-explainer',
  choose: '/select-size',
  info: '/book',
  contract: '/contract',
  deposit: '/payment',
  'cut-sheet': '/session',
};

export default function ReservationProgress({ currentStep }: ReservationProgressProps) {
  const router = useRouter();
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  // Mobile: Show "Step X of 6" only
  return (
    <>
      {/* Mobile view */}
      <div className="lg:hidden bg-brand-warm px-4 py-3 text-center">
        <p className="font-body text-sm text-brand-gray">
          Step {currentIndex + 1} of {STEPS.length}
        </p>
      </div>

      {/* Desktop view */}
      <div className="hidden lg:flex bg-brand-warm px-6 py-4 gap-4 items-center">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          const circleEl = (
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full font-body font-semibold text-sm transition-colors',
                isCompleted
                  ? 'bg-brand-green text-white'
                  : isCurrent
                    ? 'bg-brand-orange text-white'
                    : 'bg-brand-gray-light text-brand-gray'
              )}
            >
              {isCompleted ? '✓' : step.number}
            </div>
          );

          const labelEl = (
            <p
              className={cn(
                'font-body text-xs font-semibold transition-colors',
                idx <= currentIndex ? 'text-brand-dark' : 'text-brand-gray'
              )}
            >
              {step.label}
            </p>
          );

          return (
            <React.Fragment key={step.key}>
              {/* Step circle + label — clickable if completed */}
              {isCompleted ? (
                <button
                  onClick={() => router.push(stepRoutes[step.key])}
                  className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {circleEl}
                  {labelEl}
                </button>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  {circleEl}
                  {labelEl}
                </div>
              )}

              {/* Connecting line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 transition-colors',
                    isCompleted ? 'bg-brand-green' : 'bg-brand-gray-light'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
