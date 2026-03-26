import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const slotTypeLabel = (type: string) => {
  switch (type) {
    case 'whole': return 'Whole Beef';
    case 'half_a': return 'Half Beef (Side A)';
    case 'half_b': return 'Half Beef (Side B)';
    default: return type;
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'draft': return { label: 'Order Received', color: 'bg-blue-100 text-blue-700' };
    case 'in_progress': return { label: 'Cut Sheet In Progress', color: 'bg-yellow-100 text-yellow-700' };
    case 'complete': return { label: 'Cut Sheet Complete', color: 'bg-green-100 text-green-700' };
    case 'locked': return { label: 'Locked & Sent to Butcher', color: 'bg-purple-100 text-purple-700' };
    case 'processing': return { label: 'Being Processed', color: 'bg-orange-100 text-orange-700' };
    case 'beef_ready': return { label: 'Your Beef is Ready!', color: 'bg-green-100 text-green-800' };
    default: return { label: status, color: 'bg-gray-100 text-gray-700' };
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function SessionPage({ params }: PageProps) {
  const { uuid } = await params;

  // Load session with related data
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

  const statusInfo = statusLabel(session.status);

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-brand-green hover:underline mb-4 inline-block">
            ← Legacy Land & Cattle
          </Link>
          <h1 className="text-3xl font-serif font-bold text-brand-green">
            Your Beef Order
          </h1>
        </div>

        {/* Welcome Banner — only shown for draft */}
        {session.status === 'draft' && (
          <div className="bg-brand-green/5 border border-brand-green/20 rounded-xl p-5 mb-6">
            <h2 className="text-lg font-semibold text-brand-green mb-1">
              🎉 Welcome, {session.customer?.name?.split(' ')[0]}!
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              You&apos;ve successfully reserved your beef order. Next, you&apos;ll create your{' '}
              <strong>cut sheet</strong> to specify exactly how you want your meat butchered —
              steaks, roasts, ground beef, and more. We&apos;ll walk you through every choice.
            </p>
          </div>
        )}

        {/* Customer Card */}
        <div className="card mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-0.5">Customer</p>
              <p className="text-lg font-semibold text-gray-900">{session.customer?.name}</p>
              <p className="text-sm text-gray-600">{session.customer?.email}</p>
              <p className="text-sm text-gray-600">{session.customer?.phone}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="card mb-4">
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-3">Order Details</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-sm text-gray-600">Animal</span>
              <span className="font-semibold text-gray-900">{session.animal?.name}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-sm text-gray-600">Order Type</span>
              <span className="font-semibold text-gray-900">
                {session.slot ? slotTypeLabel(session.slot.slot_type) : session.purchase_type}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-sm text-gray-600">Butcher Date</span>
              <span className="font-semibold text-gray-900">
                {session.animal?.butcher_date ? formatDate(session.animal.butcher_date) : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-sm text-gray-600">Est. Ready Date</span>
              <span className="font-semibold text-gray-900">
                {session.animal?.estimated_ready_date ? formatDate(session.animal.estimated_ready_date) : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-sm text-gray-600">Hanging Weight</span>
              <span className="font-semibold text-gray-900">
                ~{session.animal?.hanging_weight_lbs} lbs
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Price per lb</span>
              <span className="font-semibold text-brand-green text-lg">
                ${session.animal?.price_per_lb?.toFixed(2)}/lb
              </span>
            </div>
          </div>
        </div>

        {/* Order ID */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Order Reference</span>
          <span className="text-xs font-mono text-gray-700">{session.id}</span>
        </div>

        {/* CTA — Cut Sheet */}
        <Link
          href={`/session/${session.id}/cuts`}
          className="btn-primary w-full text-center block text-base"
        >
          Start Your Cut Sheet →
        </Link>

        <p className="text-center text-xs text-gray-400 mt-4">
          Questions? Contact Legacy Land & Cattle directly.
        </p>
      </div>
    </main>
  );
}
