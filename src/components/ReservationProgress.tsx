'use client';

export type ReservationStep = 'learn' | 'choose' | 'info' | 'contract' | 'deposit' | 'cutsheet';

interface ReservationProgressProps {
  currentStep: ReservationStep;
}

const STEPS: { id: ReservationStep; label: string }[] = [
  { id: 'learn',    label: 'Learn' },
  { id: 'choose',   label: 'Choose' },
  { id: 'info',     label: 'Your Info' },
  { id: 'contract', label: 'Contract' },
  { id: 'deposit',  label: 'Deposit' },
  { id: 'cutsheet', label: 'Cut Sheet' },
];

const STEP_ORDER = STEPS.map((s) => s.id);

export default function ReservationProgress({ currentStep }: ReservationProgressProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="w-full bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-[700px] mx-auto">
        {/* Desktop: single row */}
        <ol className="hidden sm:flex items-center w-full">
          {STEPS.map((step, i) => {
            const isCompleted = i < currentIndex;
            const isCurrent   = i === currentIndex;

            return (
              <li key={step.id} className="flex items-center flex-1 min-w-0">
                {/* Step pill */}
                <span
                  className="flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    backgroundColor: isCurrent
                      ? '#E85D24'
                      : isCompleted
                      ? '#1A3D2B'
                      : '#E5E7EB',
                    color: isCurrent || isCompleted ? '#fff' : '#6B7280',
                  }}
                >
                  {isCompleted && (
                    <svg
                      className="w-3.5 h-3.5 mr-1 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {step.label}
                </span>

                {/* Arrow connector (not after last step) */}
                {i < STEPS.length - 1 && (
                  <span
                    className="flex-1 mx-1 text-center text-gray-400 select-none"
                    style={{ fontSize: '12px' }}
                    aria-hidden="true"
                  >
                    →
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {/* Mobile: current step label + fraction */}
        <div className="flex sm:hidden items-center gap-3">
          <span
            className="px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: '#E85D24', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}
          >
            {STEPS[currentIndex]?.label}
          </span>
          <span className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
            Step {currentIndex + 1} of {STEPS.length}
          </span>

          {/* Progress bar */}
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${((currentIndex + 1) / STEPS.length) * 100}%`,
                backgroundColor: '#E85D24',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
