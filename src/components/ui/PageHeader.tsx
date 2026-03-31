'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  showBack?: boolean;
  backHref?: string;
  currentStep?: number;
  totalSteps?: number;
}

export function PageHeader({
  showBack = false,
  backHref,
  currentStep,
  totalSteps,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header className="bg-brand-dark px-4 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {showBack && (
          <button
            onClick={handleBack}
            className="text-white hover:opacity-80 transition-opacity"
          >
            ← Back
          </button>
        )}
        <Link href="/">
          <Image
            src="/images/LLC_Logo.svg"
            alt="Legacy Land & Cattle"
            width={48}
            height={48}
            className="h-12 w-auto"
          />
        </Link>
      </div>

      {currentStep && totalSteps && (
        <div className="text-brand-gold font-body text-xs">
          Step {currentStep} of {totalSteps}
        </div>
      )}
    </header>
  );
}
