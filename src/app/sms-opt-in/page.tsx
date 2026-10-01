import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'SMS Opt-In & Consent — Legacy Land & Cattle',
  description:
    'How customers of Legacy Land & Cattle LLC opt in to order-related text messages.',
};

/**
 * Publicly accessible documentation of our SMS opt-in flow, required by
 * carrier (A2P 10DLC) campaign vetting: the real opt-in lives on step 4 of
 * the reservation funnel, which reviewers cannot reach without starting a
 * reservation, so this page reproduces that step exactly.
 */
export default function SmsOptInPage() {
  return (
    <div className="min-h-screen bg-brand-warm flex flex-col">
      <main className="flex-1 max-w-[720px] mx-auto px-5 py-14 w-full">
        <h1 className="font-display font-bold text-4xl text-brand-dark mb-2">
          SMS Opt-In &amp; Consent
        </h1>
        <p className="text-sm text-brand-gray mb-10">Legacy Land &amp; Cattle LLC</p>

        <div className="space-y-8 font-body text-brand-dark text-[15px] leading-relaxed">
          <section>
            <h2 className="font-display font-bold text-xl mb-2">How customers opt in</h2>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>
                A customer visits{' '}
                <Link href="/" className="text-brand-orange underline">
                  www.legacylandandcattleco.com
                </Link>{' '}
                and clicks <strong>Reserve My Beef</strong>.
              </li>
              <li>They choose a share size, beef type, and butcher date.</li>
              <li>
                On the <strong>&ldquo;Your Information&rdquo;</strong> step of the reservation
                form, they enter their contact details, including a required phone number.
              </li>
              <li>
                Beneath the phone number field is an <strong>optional, unchecked consent
                checkbox</strong> with the full SMS disclosure, shown below. Only customers
                who check it receive text messages; others get order updates by email.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-2">
              Screenshot of the live opt-in step
            </h2>
            <p className="mb-4">
              An unedited screenshot of the reservation form&rsquo;s &ldquo;Your
              Information&rdquo; step (step 4 of 6, reachable only by starting a
              reservation), showing the phone field and the unchecked SMS consent checkbox
              with its full disclosure (
              <a
                href="/sms-opt-in-screenshot.png"
                className="text-brand-orange underline"
              >
                direct image link
              </a>
              ):
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sms-opt-in-screenshot.png"
              alt="Screenshot of the reservation form showing the phone number field and the unchecked SMS consent checkbox with its full disclosure"
              className="w-full rounded-2xl border border-[#E5E7EB] shadow-sm mb-8"
            />
            <h2 className="font-display font-bold text-xl mb-2">
              The same step, as accessible markup
            </h2>
            <p className="mb-4">
              A faithful reproduction of that step for automated review:
            </p>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <p className="font-display font-bold text-xl mb-4">Your Information</p>
              <label className="block text-sm font-semibold text-brand-dark mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-brand-gray bg-white select-none">
                (555) 555-5555
              </div>
              <div className="flex items-start gap-2.5 mt-2">
                <input
                  type="checkbox"
                  readOnly
                  checked={false}
                  aria-label="SMS consent checkbox (shown unchecked, as on the live form)"
                  className="mt-0.5 w-4 h-4 accent-brand-orange flex-shrink-0"
                />
                <span className="text-xs text-brand-gray leading-relaxed">
                  I agree to receive order-related text messages from Legacy Land &amp; Cattle
                  LLC (deposit confirmations, cut sheet reminders, pickup scheduling). Message
                  frequency varies; message &amp; data rates may apply. Reply STOP to opt out,
                  HELP for help. See our{' '}
                  <Link href="/privacy-policy" className="underline">Privacy Policy</Link> and{' '}
                  <Link href="/terms" className="underline">Terms</Link>. Optional — we&rsquo;ll
                  use email if unchecked.
                </span>
              </div>
            </div>
            <p className="text-sm text-brand-gray mt-3">
              The checkbox is unchecked by default; consent is given only by the customer
              checking it. Consent is stored with the customer&rsquo;s record.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-2">What we send</h2>
            <p>
              Legacy Land &amp; Cattle LLC sends order-related messages only: deposit
              confirmations, cut sheet reminders, final pricing, pickup scheduling, and
              replies to customer questions. Message frequency varies with the order&rsquo;s
              progress. Message and data rates may apply. Reply <strong>STOP</strong> to opt
              out at any time or <strong>HELP</strong> for help; opting out never affects an
              order.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-2">Policies</h2>
            <p>
              <Link href="/privacy-policy" className="text-brand-orange underline">
                Privacy Policy
              </Link>{' '}
              — including: we do not sell or share SMS opt-in data or personal information
              with third parties for marketing purposes.
              <br />
              <Link href="/terms" className="text-brand-orange underline">
                Terms &amp; Conditions
              </Link>{' '}
              — including our full SMS Terms.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
