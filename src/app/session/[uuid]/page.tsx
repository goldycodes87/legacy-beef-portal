export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import QuarterCutSheetCard from '@/components/QuarterCutSheetCard';

// ─── Helpers ────────────────────────────────────────────────────────────────

const slotTypeLabel = (type: string) => {
  switch (type) {
    case 'whole':  return 'Whole Beef';
    case 'half_a': return 'Half Beef (Side A)';
    case 'half_b': return 'Half Beef (Side B)';
    default:       return type;
  }
};

type StatusInfo = {
  label: string;
  badgeClass: string;
};

const statusInfo = (status: string): StatusInfo => {
  switch (status) {
    case 'draft':       return { label: 'Not started',           badgeClass: 'bg-gray-100 text-brand-gray' };
    case 'in_progress': return { label: 'Cut sheet in progress', badgeClass: 'bg-blue-100 text-blue-700' };
    case 'complete':    return { label: 'Cut sheet complete',    badgeClass: 'bg-green-100 text-green-700' };
    case 'locked':      return { label: 'Submitted ✓',          badgeClass: 'bg-green-100 text-green-700' };
    case 'processing':  return { label: 'At the butcher',        badgeClass: 'bg-amber-100 text-amber-700' };
    case 'beef_ready':  return { label: 'Ready for pickup!',     badgeClass: 'bg-green-100 text-green-800' };
    default:            return { label: status,                  badgeClass: 'bg-gray-100 text-brand-gray' };
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// ─── CTA Button ─────────────────────────────────────────────────────────────

function SessionCTA({ status, uuid, purchaseType }: { status: string; uuid: string; purchaseType?: string }) {
  // Quarter buyers don't fill out a cut sheet — show house cut sheet card instead
  if (purchaseType === 'quarter' && (status === 'draft' || status === 'in_progress' || status === 'complete')) {
    return <QuarterCutSheetCard />;
  }

  switch (status) {
    case 'draft':
    case 'in_progress':
      return (
        <Link
          href={`/session/${uuid}/cuts`}
          className="block w-full text-center bg-brand-green text-white font-semibold py-4 px-6 rounded-xl hover:bg-brand-dark transition-colors text-base"
        >
          Continue your cut sheet →
        </Link>
      );
    case 'complete':
      return (
        <Link
          href={`/session/${uuid}/review`}
          className="block w-full text-center bg-brand-green text-white font-semibold py-4 px-6 rounded-xl hover:bg-brand-dark transition-colors text-base"
        >
          Review your choices →
        </Link>
      );
    case 'locked':
      return (
        <Link
          href={`/session/${uuid}/review`}
          className="block w-full text-center bg-brand-green text-white font-semibold py-4 px-6 rounded-xl hover:bg-brand-dark transition-colors text-base"
        >
          View your order →
        </Link>
      );
    case 'processing':
      return (
        <p className="text-center text-brand-gray text-sm py-2">
          🥩 Your beef is being processed
        </p>
      );
    case 'beef_ready':
      return (
        <Link
          href={`/session/${uuid}/pickup`}
          className="block w-full text-center bg-brand-green text-white font-semibold py-4 px-6 rounded-xl hover:bg-brand-dark transition-colors text-base"
        >
          Schedule your pickup →
        </Link>
      );
    default:
      return null;
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function SessionPage({ params }: PageProps) {
  const { uuid } = await params;

  const { data: session, error } = await supabaseAdmin
    .from('sessions')
    .select(`
      *,
      customer:customers(*),
      slot:butcher_slots(*),
      animal:animals(*)
    `)
    .eq('id', uuid)
    .single();

  if (error || !session) {
    notFound();
  }

  const info = statusInfo(session.status);
  const firstName = session.customer?.name?.split(' ')[0] ?? 'there';

  const heroHeadline = () => {
    if (session.status === 'beef_ready') return 'Your Beef is Ready! 🥩';
    if (session.status === 'locked') return 'Your Cut Sheet is Locked 🔒';
    if (session.status === 'deposit_paid' || session.status === 'in_progress') return 'Your Reservation is Confirmed ✓';
    return 'Your Beef Reservation';
  };

  return (
    <main className="min-h-screen bg-brand-warm">
      {/* Dark hero header */}
      <div className="bg-brand-dark px-4 pt-12 pb-16 text-center relative overflow-hidden">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

        <div className="relative z-10">
          {/* White logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/images/LLC_Logo_white.svg"
              alt="Legacy Land & Cattle"
              width={300}
              height={130}
              className="h-32 md:h-40 w-auto"
              priority
            />
          </div>

          {/* Greeting */}
          <p className="font-body text-white/70 text-lg mb-2">
            Welcome back, {firstName}
          </p>

          {/* Hero headline — varies by status */}
          <h1 className="font-display font-black text-white mb-4"
            style={{ fontSize: 'clamp(1.75rem, 6vw, 2.5rem)' }}>
            {heroHeadline()}
          </h1>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-lg mx-auto px-4 mt-6 pb-16">

        {/* Order Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">

          {/* Details */}
          <div className="px-6 py-5 space-y-3">
            <DetailRow
              label="Animal"
              value={session.animal?.name ?? '—'}
            />
            <DetailRow
              label="Type"
              value={session.slot ? slotTypeLabel(session.slot.slot_type) : session.purchase_type ? session.purchase_type.charAt(0).toUpperCase() + session.purchase_type.slice(1) + ' Beef' : '—'}
            />
            <DetailRow
              label="Butcher Date"
              value={session.animal?.butcher_date ? formatDate(session.animal.butcher_date) : '—'}
            />
            <DetailRow
              label="Est. Ready"
              value={session.animal?.estimated_ready_date ? formatDate(session.animal.estimated_ready_date) : '—'}
            />
            <DetailRow
              label="Price"
              value={session.price_per_lb ? `$${Number(session.price_per_lb).toFixed(2)}/lb hanging weight` : session.animal?.price_per_lb ? `$${Number(session.animal.price_per_lb).toFixed(2)}/lb hanging weight` : '—'}
              highlight
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 mx-6" />

          {/* Status + CTA */}
          <div className="px-6 py-5">
            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-brand-gray font-medium">Status:</span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${info.badgeClass}`}>
                {info.label}
              </span>
            </div>

            {/* Action Button */}
            <SessionCTA status={session.status} uuid={session.id} purchaseType={session.purchase_type} />
          </div>
        </div>

        {/* Order reference */}
        <div className="bg-white/60 rounded-xl px-4 py-2.5 flex items-center justify-between mb-6">
          <span className="text-xs text-brand-gray font-medium">Order ref</span>
          <span className="text-xs font-mono text-brand-gray">{session.id}</span>
        </div>

        <p className="text-center text-xs text-brand-gray">
          Questions? Contact Legacy Land &amp; Cattle directly.
        </p>
      </div>
    </main>
  );
}

// ─── Detail Row Component ─────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 border-b border-gray-50 last:border-0">
      <span className="text-sm text-brand-gray shrink-0">{label}</span>
      <span
        className={`text-sm text-right font-semibold ${
          highlight ? 'text-brand-dark text-base' : 'text-brand-dark'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
