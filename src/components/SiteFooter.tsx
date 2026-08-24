import Image from 'next/image';
import Link from 'next/link';

/**
 * Contact details and orientation for the public pages. The site previously
 * had no footer at all, so a visitor deciding on a $1,500–$6,000 purchase had
 * no phone number, address, or way back to anything.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-dark text-white/70">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <Image
              src="/images/LLC_Logo_white.svg"
              alt="Legacy Land &amp; Cattle"
              width={180}
              height={104}
              className="h-16 w-auto mb-4"
            />
            <p className="font-body text-sm leading-relaxed">
              Ranch-direct beef raised in Black Forest, Colorado and cut exactly
              how your family eats.
            </p>
          </div>

          <div>
            <h2 className="font-body font-semibold text-white text-sm uppercase tracking-wider mb-3">
              Get in touch
            </h2>
            <ul className="space-y-2 text-sm font-body">
              <li>
                <a href="tel:+17192581777" className="hover:text-white transition-colors">
                  (719) 258-1777
                </a>
              </li>
              <li>
                <a
                  href="mailto:orders@legacylandandcattleco.com"
                  className="hover:text-white transition-colors break-words"
                >
                  orders@legacylandandcattleco.com
                </a>
              </li>
              <li className="pt-1 leading-relaxed">
                6105 Burgess Rd
                <br />
                Colorado Springs, CO 80908
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-body font-semibold text-white text-sm uppercase tracking-wider mb-3">
              Explore
            </h2>
            <ul className="space-y-2 text-sm font-body">
              <li>
                <Link href="/weight-explainer" className="hover:text-white transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/select-animal" className="hover:text-white transition-colors">
                  Reserve your beef
                </Link>
              </li>
              <li>
                <Link href="/wagyu-waitlist" className="hover:text-white transition-colors">
                  Wagyu waitlist
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 pt-6 border-t border-white/10 text-xs font-body">
          © {year} Legacy Land &amp; Cattle, LLC. Processed at T-K Processing,
          Cañon City, Colorado.
        </p>
      </div>
    </footer>
  );
}
