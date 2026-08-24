import Link from 'next/link';
import type { SizeOffer } from '@/lib/shown-data';

const CUTS: Record<string, string> = {
  whole: '~390–465 lbs finished cuts',
  half: '~195–235 lbs finished cuts',
  quarter: '~98–118 lbs finished cuts',
};

const money = (n: number) =>
  '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });

/**
 * Prices, deposits and remaining spots for the soonest open butcher date, all
 * read from the same config the booking flow charges from.
 */
export default function ShareCards({ sizes }: { sizes: SizeOffer[] }) {
  if (sizes.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {sizes.map((s) => {
        const featured = s.size === 'half';
        const low = s.spotsRemaining > 0 && s.spotsRemaining <= 3;

        return (
          <div
            key={s.size}
            className={`relative flex flex-col bg-white rounded-2xl p-6 border ${
              featured ? 'border-brand-dark shadow-md' : 'border-brand-gray-light'
            }`}
          >
            {featured && (
              <span className="absolute -top-2.5 left-6 bg-brand-dark text-white font-body text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                Most families pick this
              </span>
            )}

            <h3 className="font-display font-bold text-2xl text-brand-dark mb-1">
              {s.label} Beef
            </h3>
            <p className="font-display text-3xl text-brand-dark tabular-nums leading-tight">
              ${s.pricePerLb.toFixed(2)}
            </p>
            <p className="font-body text-xs text-brand-gray mb-4">per lb hanging weight</p>

            <dl className="border-t border-brand-gray-light mb-4">
              <div className="flex justify-between gap-4 py-2 border-b border-gray-100 font-body text-sm">
                <dt className="text-brand-gray">Estimated total</dt>
                <dd className="font-semibold tabular-nums text-brand-dark">
                  {money(s.estLow)}–{money(s.estHigh)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2 border-b border-gray-100 font-body text-sm">
                <dt className="text-brand-gray">Cuts you take home</dt>
                <dd className="font-semibold text-brand-dark">{CUTS[s.size]}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2 font-body text-sm">
                <dt className="text-brand-gray">Deposit today</dt>
                <dd className="font-semibold tabular-nums text-brand-dark">
                  {money(s.depositAmount)}
                </dd>
              </div>
            </dl>

            {s.spotsRemaining > 0 && (
              <p
                className={`font-body text-xs font-semibold mb-4 ${
                  low ? 'text-brand-orange' : 'text-brand-dark'
                }`}
              >
                {s.spotsRemaining} left this harvest
              </p>
            )}

            <Link
              href="/weight-explainer"
              className={`mt-auto block text-center rounded-xl py-3 font-body font-semibold text-sm transition-colors ${
                featured
                  ? 'bg-brand-orange hover:bg-brand-orange-hover text-white'
                  : 'border border-brand-gray-light text-brand-dark hover:border-brand-orange'
              }`}
            >
              Choose {s.label.toLowerCase()}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
