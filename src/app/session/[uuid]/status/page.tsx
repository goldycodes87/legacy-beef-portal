import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Map DB status to milestone index (0-based)
const MILESTONES = [
  {
    key: 'booked',
    label: 'Booked',
    description: 'Your order has been reserved.',
    icon: '📋',
  },
  {
    key: 'cut_sheet_complete',
    label: 'Cut Sheet Complete',
    description: 'Your butchering instructions are finalized.',
    icon: '✂️',
  },
  {
    key: 'at_butcher',
    label: 'At Butcher',
    description: "Your beef is being processed at the butcher.",
    icon: '🔪',
  },
  {
    key: 'beef_ready',
    label: 'Ready for Pickup',
    description: "Your beef is packaged and ready!",
    icon: '📦',
  },
] as const;

// Map DB session status → milestone index
function statusToMilestoneIndex(status: string): number {
  switch (status) {
    case 'draft':
    case 'in_progress':
      return 0; // Booked
    case 'complete':
      return 1; // Cut Sheet Complete
    case 'locked':
    case 'processing':
      return 2; // At Butcher
    case 'beef_ready':
      return 3; // Ready for Pickup
    default:
      return 0;
  }
}

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

export default async function SessionStatusPage({ params }: PageProps) {
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

  const currentMilestone = statusToMilestoneIndex(session.status);
  const isBeefReady = session.status === 'beef_ready';

  return (
    <main className="min-h-screen bg-brand-warm px-4 py-10">
      <div className="max-w-lg mx-auto">

        {/* Back link */}
        <Link
          href={`/session/${uuid}`}
          className="text-sm text-brand-green hover:underline mb-6 inline-block"
        >
          ← Back to Order
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl text-brand-green">
            Order Status
          </h1>
          <p className="font-body text-sm text-brand-gray mt-1">
            {session.customer?.name} · {session.animal?.name}
          </p>
        </div>

        {/* Ready for Pickup Banner */}
        {isBeefReady && (
          <div className="bg-green-50 border border-green-300 rounded-2xl px-5 py-4 mb-6 text-center">
            <div className="text-3xl mb-2">🎉</div>
            <h2 className="text-lg font-bold text-green-800 mb-1">
              Your Beef is Ready for Pickup!
            </h2>
            <p className="text-green-700 text-sm mb-3">
              Head to our pickup location to collect your order.
            </p>
            <div className="bg-white border border-green-200 rounded-xl px-4 py-3 text-left">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Pickup Address
              </p>
              <p className="text-gray-900 font-semibold text-sm">
                6105 Burgess Rd
              </p>
              <p className="text-gray-700 text-sm">
                Colorado Springs, CO 80908
              </p>
              <a
                href="https://maps.google.com/?q=6105+Burgess+Rd,+Colorado+Springs,+CO+80908"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-green text-sm underline mt-2 inline-block"
              >
                Get Directions →
              </a>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-6 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
            Progress
          </p>

          <div className="space-y-0">
            {MILESTONES.map((milestone, index) => {
              const isCompleted = index < currentMilestone;
              const isCurrent = index === currentMilestone;
              const isUpcoming = index > currentMilestone;
              const isLast = index === MILESTONES.length - 1;

              return (
                <div key={milestone.key} className="flex gap-4">
                  {/* Left: dot + line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 transition-all
                        ${isCompleted ? 'bg-brand-green text-white' : ''}
                        ${isCurrent ? 'bg-brand-green text-white ring-4 ring-brand-green/20 scale-110' : ''}
                        ${isUpcoming ? 'bg-gray-100 text-gray-400' : ''}
                      `}
                    >
                      {isCompleted ? '✓' : milestone.icon}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 h-10 mt-1 transition-colors ${
                          isCompleted ? 'bg-brand-green' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>

                  {/* Right: text */}
                  <div className={`pb-8 ${isLast ? 'pb-0' : ''} pt-1.5`}>
                    <p
                      className={`font-semibold text-sm ${
                        isCurrent
                          ? 'text-brand-green'
                          : isCompleted
                          ? 'text-gray-700'
                          : 'text-gray-400'
                      }`}
                    >
                      {milestone.label}
                      {isCurrent && (
                        <span className="ml-2 text-xs font-normal bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </p>
                    <p
                      className={`text-xs mt-0.5 leading-relaxed ${
                        isUpcoming ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      {milestone.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order summary strip */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Order Summary
          </p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Animal</span>
              <span className="font-medium text-gray-900">{session.animal?.name}</span>
            </div>
            {session.animal?.estimated_ready_date && (
              <div className="flex justify-between">
                <span className="text-gray-500">Est. Ready</span>
                <span className="font-medium text-gray-900">
                  {formatDate(session.animal.estimated_ready_date)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID</span>
              <span className="font-mono text-xs text-gray-600 truncate max-w-[160px]">{session.id}</span>
            </div>
          </div>
        </div>

        {/* Help footer */}
        <p className="text-center text-sm text-gray-400">
          Questions?{' '}
          <a href="tel:+17195550100" className="text-brand-green underline">
            Call Grant at (719) 555-0100
          </a>
        </p>
      </div>
    </main>
  );
}
