'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StartClient({
  prefill,
}: {
  prefill: { id: string; first: string; last: string; email: string; phone: string } | null;
}) {
  const router = useRouter();

  useEffect(() => {
    try {
      if (prefill) {
        sessionStorage.setItem('prospectCustomerId', prefill.id);
        if (prefill.first) sessionStorage.setItem('customerFirstName', prefill.first);
        if (prefill.last) sessionStorage.setItem('customerLastName', prefill.last);
        if (prefill.email) sessionStorage.setItem('customerEmail', prefill.email);
        if (prefill.phone) sessionStorage.setItem('customerPhone', prefill.phone);
      }
    } catch {
      // Storage unavailable — the funnel still works, just unprefilled.
    }
    router.replace('/weight-explainer');
  }, [prefill, router]);

  return (
    <div className="min-h-screen bg-brand-warm flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-5xl mb-4">🤠</div>
        <h1 className="font-display font-bold text-2xl text-brand-dark mb-2">
          {prefill?.first ? `Welcome, ${prefill.first}!` : 'Welcome to Legacy Land & Cattle!'}
        </h1>
        <p className="font-body text-brand-gray text-sm">Setting up your order…</p>
      </div>
    </div>
  );
}
