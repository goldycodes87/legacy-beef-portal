import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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
    case 'draft':       return { label: 'Not started',           badgeClass: 'bg-gray-100 text-gray-600' };
    case 'in_progress': return { label: 'Cut sheet in progress', badgeClass: 'bg-blue-100 text-blue-700' };
    case 'complete':    return { label: 'Cut sheet complete',    badgeClass: 'bg-green-100 text-green-700' };
    case 'locked':      return { label: 'Submitted ✓',          badgeClass: 'bg-green-100 text-green-700' };
    case 'processing':  return { label: 'At the butcher',        badgeClass: 'bg-amber-100 text-amber-700' };
    case 'beef_ready':  return { label: 'Ready for pickup!',     badgeClass: 'bg-green-100 text-green-800' };
    default:            return { label: status,                  badgeClass: 'bg-gray-100 text-gray-600' };
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

function SessionCTA({ status, uuid }: { status: string; uuid: string }) {
  switch (status) {
    case 'draft':
    case 'in_progress':
      return (
        <Link
          href={`/session/${uuid}/cuts`}
          className="block w-full text-center bg-[#2D5016] text-white font-semibold py-4 px-6 rounded-xl hover:bg-[#3a6620] transition-colors text-base"
        >
          Continue your cut sheet →
        </Link>
      );
    case 'complete':
      return (
        <Link
          href={`/session/${uuid}/review`}
          className="block w-full text-center bg-[#2D5016] text-white font-semibold py-4 px-6 rounded-xl hover:bg-[#3a6620] transition-colors text-base"
        >
          Review your choices →
        </Link>
      );
    case 'locked':
      return (
        <Link
          href={`/session/${uuid}/review`}
          className="block w-full text-center bg-[#2D5016] text-white font-semibold py-4 px-6 rounded-xl hover:bg-[#3a6620] transition-colors text-base"
        >
          View your order →
        </Link>
      );
    case 'processing':
      return (
        <p className="text-center text-gray-500 text-sm py-2">
          🥩 Your beef is being processed
        </p>
      );
    case 'beef_ready':
      return (
        <Link
          href={`/session/${uuid}/status`}
          className="block w-full text-center bg-[#2D5016] text-white font-semibold py-4 px-6 rounded-xl hover:bg-[#3a6620] transition-colors text-base"
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

  return (
    <main className="min-h-screen px-4 py-12 bg-[#F5F0E8]">
      <div className="max-w-lg mx-auto">

        {/* Brand wordmark */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-serif font-bold text-[#2D5016]">
              Legacy Land &amp; Cattle
            </h1>
            <p className="text-xs text-[#8B6914] uppercase tracking-widest mt-0.5">
              Customer Portal
            </p>
          </Link>
        </div>

        {/* Welcome */}
        <p className="text-gray-600 text-center mb-6 text-sm">
          Welcome back, <span className="font-semibold text-gray-900">{firstName}</span>
        </p>

        {/* Order Card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-4">
          {/* Animal Name Header */}
          <div className="bg-[#2D5016] px-6 py-5">
            <p className="text-[#C4A46B] text-xs uppercase tracking-widest mb-1">Your Beef Order</p>
            <h2 className="text-white text-2xl font-serif font-bold">
              {session.animal?.name ?? 'Your Animal'}
            </h2>
          </div>

          {/* Details */}
          <div className="px-6 py-5 space-y-3">
            <DetailRow
              label="Animal"
              value={session.animal?.name ?? '—'}
            />
            <DetailRow
              label="Type"
              value={session.slot ? slotTypeLabel(session.slot.slot_type) : session.purchase_type ?? '—'}
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
              value={session.animal?.price_per_lb ? `$${session.animal.price_per_lb.toFixed(2)}/lb hanging weight` : '—'}
              highlight
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 mx-6" />

          {/* Status + CTA */}
          <div className="px-6 py-5">
            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500 font-medium">Status:</span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${info.badgeClass}`}>
                {info.label}
              </span>
            </div>

            {/* Action Button */}
            <SessionCTA status={session.status} uuid={session.id} />
          </div>
        </div>

        {/* Order reference */}
        <div className="bg-white/60 rounded-xl px-4 py-2.5 flex items-center justify-between mb-6">
          <span className="text-xs text-gray-400 font-medium">Order ref</span>
          <span className="text-xs font-mono text-gray-500">{session.id}</span>
        </div>

        <p className="text-center text-xs text-gray-400">
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
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span
        className={`text-sm text-right font-semibold ${
          highlight ? 'text-[#2D5016] text-base' : 'text-gray-900'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
