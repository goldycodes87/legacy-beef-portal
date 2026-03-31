'use client';

import React from 'react';

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

export default function ReservationProgress({ currentStep }: ReservationProgressProps) {
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
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.key}>
            {/* Step circle */}
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full font-body font-semibold text-sm transition-colors',
                idx < currentIndex
                  ? 'bg-brand-green text-white' // Completed
                  : idx === currentIndex
                    ? 'bg-brand-orange text-white' // Current
                    : 'bg-brand-gray-light text-brand-gray' // Future
              )}
            >
              {idx < currentIndex ? '✓' : step.number}
            </div>

            {/* Step label */}
            <p
              className={cn(
                'font-body text-xs font-semibold transition-colors',
                idx <= currentIndex ? 'text-brand-dark' : 'text-brand-gray'
              )}
            >
              {step.label}
            </p>

            {/* Connecting line */}
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 transition-colors',
                  idx < currentIndex ? 'bg-brand-green' : 'bg-brand-gray-light'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
