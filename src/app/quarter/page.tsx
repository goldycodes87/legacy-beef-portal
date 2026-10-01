import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import { QUARTER_YIELD, QUARTER_STATS } from '@/lib/quarter-yield';

export const metadata: Metadata = {
  title: 'What Comes in a Quarter — Legacy Land & Cattle',
  description:
    'A typical quarter beef from Legacy Land & Cattle: about 110 lbs of boxed beef cut to our Legacy House Cut — ribeyes, T-bones, sirloins, chuck steaks, brisket, and 50+ pounds of ground beef.',
};

/**
 * The answer to "what do I actually get in a quarter?" — asked by enough
 * customers that it earned its own page. Quantities are Grant's numbers for
 * a 1,250–1,300 lb animal cut to the Legacy House Cut; QUARTER_YIELD is the
 * single source shared with the pop-up modal.
 */
export default function QuarterPage() {
  return (
    <div className="min-h-screen bg-brand-warm flex flex-col">
      <main className="flex-1 max-w-[720px] mx-auto px-5 py-14 w-full">
        <p className="font-body text-xs font-bold uppercase tracking-[0.14em] text-brand-orange mb-2">
          Quarter Beef · Legacy House Cut
        </p>
        <h1 className="font-display font-bold text-4xl text-brand-dark mb-3">
          What comes in a quarter?
        </h1>
        <p className="font-body text-brand-gray text-[15px] leading-relaxed max-w-[58ch] mb-7">
          Every quarter is cut to our <strong className="text-brand-dark">Legacy House Cut</strong> —
          the balanced mix of steaks, roasts, and ground beef we&rsquo;d stock our own freezer
          with. There&rsquo;s no cut sheet to fill out; we handle it. Here&rsquo;s what a typical
          quarter from one of our 1,250&ndash;1,300&nbsp;lb animals looks like:
        </p>

        <div className="grid grid-cols-3 gap-3 mb-7">
          {[
            [QUARTER_STATS.boxed, 'boxed beef'],
            [QUARTER_STATS.steaks, 'steaks'],
            [QUARTER_STATS.freezer, 'freezer space'],
          ].map(([v, label]) => (
            <div
              key={label}
              className="bg-white border border-[#E5E7EB] rounded-2xl text-center py-4 shadow-sm"
            >
              <p className="font-display font-bold text-brand-green text-2xl leading-tight">{v}</p>
              <p className="font-body text-[11px] uppercase tracking-wide text-brand-gray mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden mb-4">
          <table className="w-full text-sm border-collapse font-body">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-brand-gray">
                <th className="px-4 pt-4 pb-2 border-b-2 border-brand-orange/25 font-semibold">Cut</th>
                <th className="px-4 pt-4 pb-2 border-b-2 border-brand-orange/25 font-semibold">What you get</th>
                <th className="px-4 pt-4 pb-2 border-b-2 border-brand-orange/25 font-semibold text-right">Approx. weight</th>
              </tr>
            </thead>
            <tbody>
              {QUARTER_YIELD.map((row, i) => (
                <tr key={row.cut} className={i % 2 === 1 ? 'bg-brand-warm/50' : undefined}>
                  <td className="px-4 py-2.5 border-b border-gray-50">
                    <span className="font-medium text-brand-dark">{row.cut}</span>
                    {row.spec && (
                      <span className="block text-xs text-brand-gray">{row.spec}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 border-b border-gray-50 text-brand-gray">{row.count}</td>
                  <td className="px-4 py-2.5 border-b border-gray-50 text-brand-gray text-right whitespace-nowrap tabular-nums">
                    {row.lbs}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="px-4 py-3 bg-brand-dark text-white font-semibold rounded-bl-2xl">
                  Your freezer
                  <span className="block text-xs font-normal text-white/60">
                    typical total — varies with the animal
                  </span>
                </td>
                <td className="px-4 py-3 bg-brand-dark text-white font-bold text-right whitespace-nowrap tabular-nums">
                  ~105–115 lbs
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="font-body text-xs text-brand-gray italic leading-relaxed mb-8">
          Weights are honest approximations — every animal is different, and your final price is
          always actual hanging weight × your quoted price per pound. Ground beef makes up close
          to half the box: about a year of burgers, tacos, and meatballs.
        </p>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-5 mb-8">
          <h2 className="font-display font-bold text-lg text-brand-dark mb-1.5">
            Why is every quarter the same?
          </h2>
          <p className="font-body text-sm text-brand-gray leading-relaxed">
            A steer doesn&rsquo;t divide into four identical pieces — your quarter shares primal
            cuts with three other families. Cutting every quarter to one proven sheet is the only
            way each family gets a fair, complete share of the best cuts. Want it cut your way,
            cut for cut? That&rsquo;s exactly what a{' '}
            <Link href="/weight-explainer" className="text-brand-orange underline">
              half beef
            </Link>{' '}
            gives you — a fully custom cut sheet.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/weight-explainer"
            className="flex-1 text-center bg-brand-orange hover:bg-brand-orange-hover text-white py-3.5 rounded-xl font-body font-semibold transition-colors"
          >
            Reserve a Quarter →
          </Link>
          <a
            href="tel:+17192581777"
            className="flex-1 text-center bg-white border-2 border-brand-dark text-brand-dark py-3 rounded-xl font-body font-semibold hover:bg-brand-warm transition-colors"
          >
            Questions? (719) 258-1777
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
