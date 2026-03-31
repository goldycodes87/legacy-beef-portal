'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ESignContract from '@/components/ESignContract';
import ReservationProgress from '@/components/ReservationProgress';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface Animal {
  id: string;
  name: string;
  butcher_date: string | null;
  estimated_ready_date: string | null;
  price_per_lb: number;
}

interface Session {
  id: string;
  customer_id: string;
  animal_id: string;
  purchase_type: 'whole' | 'half' | 'quarter';
  is_splitting?: boolean;
  contract_signed?: boolean;
  deposit_amount?: number;
}

interface PageState {
  status: 'loading' | 'ready' | 'error' | 'already-signed';
  errorMessage?: string;
  session?: Session;
  customer?: Customer;
  animal?: Animal;
  depositAmount?: number;
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function ContractPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    async function init() {
      const sessionId = sessionStorage.getItem('session_id');

      if (!sessionId) {
        router.replace('/select-size?error=session_not_found');
        return;
      }

      const res = await fetch(`/api/session/${sessionId}`);
      const data = await res.json();

      const depositAmount = data.deposit_amount ?? (() => {
        switch (data.purchase_type) {
          case 'whole': return 850;
          case 'half': return 500;
          case 'quarter': return 250;
          default: return 500;
        }
      })();

      if (!res.ok || !data.id) {
        console.error('Failed to load session:', data);
        router.replace('/select-size?error=session_not_found');
        return;
      }

      const sessionData = {
        id: data.id,
        customer_id: data.customer_id,
        animal_id: data.animal_id,
        purchase_type: data.purchase_type,
        is_splitting: data.is_splitting,
        contract_signed: data.contract_signed,
        deposit_amount: data.deposit_amount,
      };

      const customer: Customer = data.customer;
      const animal: Animal = data.animal;

      if (!customer) {
        setState({ status: 'error', errorMessage: 'Could not load customer details. Please contact support.' });
        return;
      }

      if (!animal) {
        setState({ status: 'error', errorMessage: 'Could not load animal details. Please contact support.' });
        return;
      }

      if (sessionData.contract_signed === true) {
        setState({ status: 'already-signed' });
        router.replace('/payment');
        return;
      }

      const finalDepositAmount = sessionData.deposit_amount ?? depositAmount;

      setState({
        status: 'ready',
        session: sessionData,
        customer,
        animal,
        depositAmount: finalDepositAmount,
      });
    }

    init().catch((err) => {
      console.error('Contract page init error:', err);
      setState({ status: 'error', errorMessage: 'Unexpected error. Please try again.' });
    });
  }, [router]);

  function handleSigned(sessionId: string) {
    router.push('/payment');
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-brand-warm">
      <PageHeader showBack={true} currentStep={5} totalSteps={6} />

      <ReservationProgress currentStep="contract" />

      <main>
        {state.status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <svg className="animate-spin h-10 w-10 text-brand-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="font-body text-brand-gray text-sm">Loading your agreement…</p>
          </div>
        )}

        {state.status === 'already-signed' && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <p className="font-body text-brand-gray">Redirecting to payment…</p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="max-w-[720px] mx-auto px-4 py-16 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="font-display font-bold text-2xl text-brand-dark mb-3">
              Something went wrong
            </h1>
            <p className="font-body text-brand-gray mb-6">{state.errorMessage}</p>
            <Button onClick={() => router.push('/select-size')}>
              Start Over
            </Button>
          </div>
        )}

        {state.status === 'ready' &&
          state.session &&
          state.customer &&
          state.animal &&
          state.depositAmount && (
            <ESignContract
              session={state.session}
              customer={state.customer}
              animal={state.animal}
              slot={{ depositAmount: state.depositAmount }}
              onSigned={handleSigned}
            />
          )}
      </main>
    </div>
  );
}
