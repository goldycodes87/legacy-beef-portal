import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Terms & Deposit Policy | Legacy Land & Cattle',
  description: 'Review our terms, deposit policy, and purchase agreement for beef orders.',
};

export default function ContractPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-brand-dark px-4 py-4 flex items-center">
        <Image
          src="/images/LLC_Logo.svg"
          alt="Legacy Land &amp; Cattle"
          width={140}
          height={60}
          className="h-10 w-auto object-contain"
        />
      </header>

      <main className="max-w-[680px] mx-auto px-4 py-12">
        <Link href="/book" className="text-sm text-brand-orange hover:underline mb-6 inline-flex items-center gap-1">
          ← Back to Booking
        </Link>

        <h1
          className="text-3xl md:text-4xl font-bold text-brand-dark mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Terms &amp; Deposit Policy
        </h1>
        <p className="text-brand-gray text-base mb-8">
          Please review these terms before completing your beef reservation.
        </p>

        {/* Notice Banner */}
        <div className="bg-amber-50 border border-amber-300 rounded-2xl px-5 py-4 mb-8 flex gap-3">
          <span className="text-xl flex-shrink-0">🚧</span>
          <div>
            <p className="font-semibold text-amber-900 mb-1">Full Contract Coming Soon</p>
            <p className="text-sm text-amber-800 leading-relaxed">
              A detailed purchase agreement is being finalized. The key terms below govern all current reservations.
              By completing a reservation, you agree to these terms.
            </p>
          </div>
        </div>

        {/* Terms sections */}
        <div className="space-y-6 text-brand-gray">

          <Section title="1. Deposit">
            <p>
              A non-refundable deposit is required to secure your slot. Deposit amounts are:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li><strong>Whole Beef</strong> — $850 deposit</li>
              <li><strong>Half Beef</strong> — $500 deposit</li>
              <li><strong>Quarter Beef</strong> — $250 deposit</li>
            </ul>
            <p className="mt-2">
              Deposits are applied toward the total purchase price. Payment details will be sent by email
              within 24 hours of reservation.
            </p>
          </Section>

          <Section title="2. Pricing">
            <p>
              All pricing is based on <strong>hanging weight</strong> — the weight of the carcass after
              slaughter and initial processing, before butchering into finished cuts.
              Final price is calculated at hanging weight × price per lb.
            </p>
            <p className="mt-2">
              Finished cut weights are typically 55–60% of hanging weight due to trimming and bone removal.
            </p>
          </Section>

          <Section title="3. Balance Payment">
            <p>
              The remaining balance (total price minus deposit) is due when your beef is ready for pickup.
              We accept cash, check, and electronic payment.
            </p>
          </Section>

          <Section title="4. Cancellation Policy">
            <p>
              Cancellations made more than 30 days before butcher date will receive a deposit refund
              minus a $50 processing fee.
              Cancellations within 30 days of butcher date forfeit the full deposit.
            </p>
          </Section>

          <Section title="5. Cut Sheet">
            <p>
              Customers are responsible for submitting a completed cut sheet before butcher day.
              If no cut sheet is received, Legacy Land &amp; Cattle will use our standard house cut sheet
              at no extra charge.
            </p>
          </Section>

          <Section title="6. Pickup & Storage">
            <p>
              Customers must arrange pickup within 7 days of beef being ready.
              Storage beyond this window may incur fees. We will notify you when your order is ready.
            </p>
          </Section>

          <Section title="7. Questions">
            <p>
              Contact us any time at{' '}
              <a href="mailto:orders@legacylandandcattleco.com" className="text-brand-orange hover:underline">
                orders@legacylandandcattleco.com
              </a>{' '}
              or via our website.
            </p>
          </Section>
        </div>

        {/* Back to booking CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/book"
            className="inline-block bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-150"
          >
            ← Back to Booking
          </Link>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-component ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[#E5E7EB] pt-6">
      <h2
        className="text-lg font-bold text-brand-dark mb-3"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {title}
      </h2>
      <div className="text-sm leading-relaxed space-y-2">{children}</div>
    </div>
  );
}
