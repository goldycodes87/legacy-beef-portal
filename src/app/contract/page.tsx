'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ESignContract from '@/components/ESignContract';
import ReservationProgress from '@/components/ReservationProgress';

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

function depositForType(type: string): number {
  switch (type) {
    case 'whole':   return 850;
    case 'half':    return 500;
    case 'quarter': return 250;
    default:        return 500;
  }
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function ContractPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    async function init() {
      // 1. Check for session_id in sessionStorage
      const sessionId = sessionStorage.getItem('session_id');
      if (!sessionId) {
        router.replace('/select-size?error=session_not_found');
        return;
      }

      // 2. Check Supabase auth
      const { data: { session: authSession } } = await supabase.auth.getSession();
      // Note: this app uses service-key API routes; auth check is best-effort for block 8.
      // If no Supabase auth, proceed but rely on session_id guard.

      // 3. Load session record
      // Note: is_splitting and deposit_amount require Block 8 DB migration
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id, customer_id, animal_id, purchase_type, contract_signed')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        router.replace('/select-size?error=session_not_found');
        return;
      }

      // 4. Must have customer_id
      if (!sessionData.customer_id) {
        router.replace('/select-size?error=session_not_found');
        return;
      }

      // 5. Already signed → redirect to /payment
      if (sessionData.contract_signed === true) {
        setState({ status: 'already-signed' });
        router.replace('/payment');
        return;
      }

      // 6. Load customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, name, email, phone, address, city, state, zip')
        .eq('id', sessionData.customer_id)
        .single();

      if (customerError || !customer) {
        setState({ status: 'error', errorMessage: 'Could not load customer details. Please contact support.' });
        return;
      }

      // 7. Load animal
      const { data: animal, error: animalError } = await supabase
        .from('animals')
        .select('id, name, butcher_date, estimated_ready_date, price_per_lb')
        .eq('id', sessionData.animal_id)
        .single();

      if (animalError || !animal) {
        setState({ status: 'error', errorMessage: 'Could not load animal details. Please contact support.' });
        return;
      }

      // deposit_amount column requires Block 8 DB migration; use purchase_type fallback
      const depositAmount = depositForType(sessionData.purchase_type);

      setState({
        status: 'ready',
        session: sessionData,
        customer,
        animal,
        depositAmount,
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-brand-dark px-4 py-4 flex items-center sticky top-0 z-10">
        <Image
          src="/images/LLC_Logo.svg"
          alt="Legacy Land &amp; Cattle"
          width={140}
          height={60}
          className="h-10 w-auto object-contain"
        />
      </header>

      <ReservationProgress currentStep="contract" />

      <main>
        {state.status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <svg className="animate-spin h-10 w-10 text-brand-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-brand-gray text-sm">Loading your agreement…</p>
          </div>
        )}

        {state.status === 'already-signed' && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <p className="text-brand-gray">Redirecting to payment…</p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="max-w-[720px] mx-auto px-4 py-16 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-brand-dark mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Something went wrong
            </h1>
            <p className="text-brand-gray mb-6">{state.errorMessage}</p>
            <button
              onClick={() => router.push('/select-size')}
              className="btn-primary"
            >
              Start Over
            </button>
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
