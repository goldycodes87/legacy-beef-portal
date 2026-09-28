import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Legacy Land & Cattle',
  description: 'Terms and conditions for ordering beef from Legacy Land & Cattle, LLC, including our SMS terms.',
};

/**
 * Required for the Twilio A2P campaign registration: page titled
 * "Terms & Conditions", naming the registered brand, with an SMS Terms
 * section carrying the "message and data rates may apply" disclosure.
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-warm flex flex-col">
      <main className="flex-1 max-w-[720px] mx-auto px-5 py-14 w-full">
        <h1 className="font-display font-bold text-4xl text-brand-dark mb-2">
          Terms &amp; Conditions
        </h1>
        <p className="text-sm text-brand-gray mb-10">
          Legacy Land &amp; Cattle, LLC · Effective September 28, 2026
        </p>

        <div className="space-y-8 font-body text-brand-dark text-[15px] leading-relaxed">
          <section>
            <h2 className="font-display font-bold text-xl mb-2">Orders and deposits</h2>
            <p>
              Reserving a whole, half, or quarter beef share from Legacy Land &amp; Cattle, LLC
              requires a deposit, which holds your share for a specific butcher date. Your
              deposit is credited toward your final balance. Reservations started but not paid
              within 24 hours may be released.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-2">Pricing by hanging weight</h2>
            <p>
              Beef is priced per pound of hanging weight, which is only known after processing.
              Your final balance is the hanging weight multiplied by your quoted price per
              pound, minus your deposit and any discounts. The price per pound quoted at
              reservation is the price you pay.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-2">Cut sheets</h2>
            <p>
              Half and whole shares include a custom cut sheet. Cut sheets not completed by
              seven days before the butcher date are completed with our Legacy House Cut
              defaults so your order can be processed on time.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-2">Pickup</h2>
            <p>
              Orders are picked up at our ranch in Black Forest, Colorado at a scheduled time;
              the exact address is provided with your pickup confirmation. Bring coolers —
              your beef is frozen and boxed. Balances are due at or before pickup.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-2">SMS Terms</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                By providing your phone number in our reservation form, you consent to receive
                order-related text messages from Legacy Land &amp; Cattle, LLC — for example
                deposit confirmations, cut sheet reminders, and pickup scheduling.
              </li>
              <li>Message frequency varies with your order&rsquo;s progress.</li>
              <li>
                <strong>Message and data rates may apply</strong>, depending on your mobile
                carrier and plan.
              </li>
              <li>
                Reply <strong>STOP</strong> at any time to opt out of texts. Reply{' '}
                <strong>HELP</strong> for help, or contact us at{' '}
                <a className="text-brand-orange underline" href="tel:+17192581777">(719) 258-1777</a>.
              </li>
              <li>
                Opting out of texts does not affect your order; we&rsquo;ll reach you by email
                or phone instead.
              </li>
              <li>Carriers are not liable for delayed or undelivered messages.</li>
              <li>
                See our{' '}
                <Link href="/privacy-policy" className="text-brand-orange underline">
                  Privacy Policy
                </Link>{' '}
                for how we handle your information. We do not sell or share your SMS opt-in
                data or personal information with third parties for marketing purposes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-2">Questions</h2>
            <p>
              Legacy Land &amp; Cattle, LLC · Black Forest, Colorado
              <br />
              <a className="text-brand-orange underline" href="mailto:orders@legacylandandcattleco.com">
                orders@legacylandandcattleco.com
              </a>{' '}
              · <a className="text-brand-orange underline" href="tel:+17192581777">(719) 258-1777</a>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
