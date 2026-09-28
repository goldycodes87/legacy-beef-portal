import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy — Legacy Land & Cattle',
  description: 'How Legacy Land & Cattle LLC collects, uses, and protects your information.',
};

/**
 * Required for the Twilio A2P campaign registration, and good practice
 * besides: page must be titled "Privacy Policy", name the registered brand,
 * describe what we collect and how it's used, and carry the no-sale
 * statement verbatim.
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-brand-warm flex flex-col">
      <main className="flex-1 max-w-[720px] mx-auto px-5 py-14 w-full">
        <h1 className="font-display font-bold text-4xl text-brand-dark mb-2">Privacy Policy</h1>
        <p className="text-sm text-brand-gray mb-10">
          Legacy Land &amp; Cattle LLC · Effective September 28, 2026
        </p>

        <div className="space-y-8 font-body text-brand-dark text-[15px] leading-relaxed">
          <section>
            <h2 className="font-display font-bold text-xl mb-2">Who we are</h2>
            <p>
              Legacy Land &amp; Cattle LLC (&ldquo;Legacy Land &amp; Cattle,&rdquo;
              &ldquo;we,&rdquo; &ldquo;us&rdquo;) is a family ranch in Black Forest, Colorado
              selling whole, half, and quarter beef shares directly to customers through this
              website, www.legacylandandcattleco.com.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-2">What we collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Contact information</strong> you provide when reserving beef or joining a
                waitlist: name, email address, phone number, and mailing address.
              </li>
              <li>
                <strong>Order information</strong>: what you reserved, your butcher-date
                selection, your cut sheet preferences, deposits and payments made, and pickup
                scheduling details.
              </li>
              <li>
                <strong>Payment details</strong> are processed by Square, our payment processor.
                We never see or store your full card number.
              </li>
              <li>
                <strong>Email delivery events</strong> (sent, delivered, bounced) from our email
                provider, so we know our order updates reached you.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-2">How we use it</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To fulfill your order: reservations, deposits, cut sheets, and pickup.</li>
              <li>
                To communicate with you about your order by email, phone, or text message —
                deposit confirmations, cut sheet reminders, final pricing, and pickup scheduling.
              </li>
              <li>To answer questions when you contact us.</li>
              <li>To keep basic business records required for accounting and taxes.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-2">Text messaging (SMS)</h2>
            <p>
              When you provide your phone number in our reservation form, you agree to receive
              order-related text messages from Legacy Land &amp; Cattle LLC. Message frequency
              varies with your order&rsquo;s progress; message and data rates may apply. Reply
              STOP at any time to opt out, or HELP for help.
            </p>
            <p className="mt-3 font-semibold">
              We do not sell or share your SMS opt-in data or personal information with third
              parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-2">Who we share data with</h2>
            <p>
              Only the service providers needed to run the business: Square (payments), Resend
              (email delivery), Twilio (text messages), and our website hosting and database
              providers. Each receives only what it needs to do its job. We do not sell your
              personal information to anyone.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-2">Cookies</h2>
            <p>
              We use a small number of functional cookies — for example, to keep you signed in
              to your order after you follow a secure link from an email. We do not use
              advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-2">Your choices</h2>
            <p>
              You can ask us at any time to see, correct, or delete the personal information we
              hold about you (records we&rsquo;re legally required to keep, such as payment
              history, may be retained). Reply STOP to any text to stop receiving texts, or use
              the unsubscribe instructions in our emails.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl mb-2">Contact</h2>
            <p>
              Legacy Land &amp; Cattle LLC · Black Forest, Colorado
              <br />
              <a className="text-brand-orange underline" href="mailto:orders@legacylandandcattleco.com">
                orders@legacylandandcattleco.com
              </a>{' '}
              · <a className="text-brand-orange underline" href="tel:+17192581777">(719) 258-1777</a>
            </p>
          </section>

          <p className="text-sm text-brand-gray">
            See also our <Link href="/terms" className="text-brand-orange underline">Terms &amp; Conditions</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
