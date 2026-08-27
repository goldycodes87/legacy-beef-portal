import type { Metadata } from 'next';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Sample Cut Sheet',
  description:
    'See exactly what a Legacy Land & Cattle cut sheet looks like — every section, every choice, and what the Legacy House Cut picks for you.',
};

/**
 * A read-only sample of the real cut sheet, for people deciding whether to
 * buy. The sections, options and house defaults below mirror the wizard and
 * the sheet we hand T-K Processing — if the wizard changes, change this too.
 */

interface SampleSection {
  emoji: string;
  name: string;
  quarter: 'Front Quarter' | 'Hind Quarter' | 'Everything Else';
  decide: string;
  options: string[];
  houseDefault: string;
}

const SECTIONS: SampleSection[] = [
  {
    emoji: '🥩',
    name: 'Chuck',
    quarter: 'Front Quarter',
    decide: 'Steaks, roasts, or grind it all into ground beef.',
    options: ['Steaks — pick thickness and steaks per pack', 'Roasts — pick roast size', 'Grind'],
    houseDefault: 'Steaks, 1" thick, 2 per pack',
  },
  {
    emoji: '🍖',
    name: 'Brisket',
    quarter: 'Front Quarter',
    decide: 'Keep it whole, split it in half, or grind it.',
    options: ['Yes — whole', 'Yes — halved', 'No — grind it'],
    houseDefault: 'Halved',
  },
  {
    emoji: '🥩',
    name: 'Skirt Steak',
    quarter: 'Front Quarter',
    decide: 'Keep it or grind it. Fajita night says keep it.',
    options: ['Yes', 'No — grind it'],
    houseDefault: 'Keep it',
  },
  {
    emoji: '🍖',
    name: 'Rib',
    quarter: 'Front Quarter',
    decide: 'Ribeye steaks or a rib roast — bone-in or boneless either way.',
    options: [
      'Bone-in steaks — pick thickness and per pack',
      'Boneless steaks',
      'Bone-in roast (prime rib)',
      'Boneless roast',
    ],
    houseDefault: 'Bone-in steaks, 1" thick, 2 per pack',
  },
  {
    emoji: '🍖',
    name: 'Short Ribs',
    quarter: 'Front Quarter',
    decide: 'Keep them or grind them.',
    options: ['Yes', 'No — grind them'],
    houseDefault: 'Keep them',
  },
  {
    emoji: '🥩',
    name: 'Sirloin',
    quarter: 'Hind Quarter',
    decide: 'Steaks, roasts, or grind.',
    options: ['Steaks — pick thickness and per pack', 'Roasts', 'Grind'],
    houseDefault: 'Steaks, 1" thick, 2 per pack',
  },
  {
    emoji: '🥩',
    name: 'Round',
    quarter: 'Hind Quarter',
    decide: 'Steaks, roasts, or grind. A lot of families grind the round.',
    options: ['Steaks', 'Roasts', 'Grind'],
    houseDefault: 'Grind',
  },
  {
    emoji: '🥩',
    name: 'Short Loin',
    quarter: 'Hind Quarter',
    decide:
      'The classic choice: T-bones, or cut the same beef into NY strips and filet mignon instead.',
    options: ['T-bone steaks — pick thickness and per pack', 'NY Strip & Filet'],
    houseDefault: 'T-bones, 1" thick, 2 per pack',
  },
  {
    emoji: '🥩',
    name: 'Flank Steak',
    quarter: 'Hind Quarter',
    decide: 'Keep it or grind it.',
    options: ['Yes', 'No — grind it'],
    houseDefault: 'Keep it',
  },
  {
    emoji: '🍲',
    name: 'Stew Meat',
    quarter: 'Everything Else',
    decide: 'Want cubed stew meat set aside?',
    options: ['Yes', 'No'],
    houseDefault: 'No — goes to ground beef instead',
  },
  {
    emoji: '🥩',
    name: 'Tenderized Round',
    quarter: 'Everything Else',
    decide: 'Cube steak / chicken-fried-steak territory.',
    options: ['Yes', 'No'],
    houseDefault: 'Skipped',
  },
  {
    emoji: '🫀',
    name: 'Organs',
    quarter: 'Everything Else',
    decide: 'Tongue, heart, liver, oxtail — take any you want.',
    options: ['Tongue', 'Heart', 'Liver', 'Oxtail', 'None'],
    houseDefault: 'None',
  },
  {
    emoji: '🦴',
    name: 'Bones',
    quarter: 'Everything Else',
    decide: 'Soup bones for broth, dog bones, or none.',
    options: ['Soup bones', 'Dog bones', 'None'],
    houseDefault: 'Soup bones',
  },
  {
    emoji: '📦',
    name: 'Ground Beef',
    quarter: 'Everything Else',
    decide:
      'Everything you grind ends up here. Pick your fat blend and how big each package is.',
    options: ['Fat blend (e.g. 85/15)', 'Pounds per package'],
    houseDefault: '85/15, 1 lb packages',
  },
];

const QUARTERS = ['Front Quarter', 'Hind Quarter', 'Everything Else'] as const;

const STEPS: Array<{ num: string; title: string; body: string }> = [
  {
    num: '1',
    title: 'Reserve first, cut sheet after',
    body: 'You don’t fill this out to buy. Once your deposit is in, we email you a private link to your cut sheet — no login, no password.',
  },
  {
    num: '2',
    title: 'One section at a time',
    body: 'The wizard walks the animal front to back, one decision per screen, with a diagram showing where each cut comes from. Every answer saves as you go, so you can do it from your phone in line at the grocery store and finish later.',
  },
  {
    num: '3',
    title: 'Not sure? Use the Legacy House Cut',
    body: 'One tap fills the whole sheet with the well-rounded selection below — the defaults most families are happy with. You can still change any section afterward.',
  },
  {
    num: '4',
    title: 'Lock it in',
    body: 'When you’re happy, you lock it and we hand-deliver it to T-K Processing before butcher day. We’ll remind you 10 days out, and if life gets busy the house selections cover you automatically a week before.',
  },
];

export default function SampleCutSheetPage() {
  return (
    <div className="min-h-screen bg-brand-warm flex flex-col">
      <SiteNav />

      {/* Hero */}
      <section className="bg-brand-dark px-4 pt-12 pb-14 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4" aria-hidden="true">✂️</div>
          <h1 className="font-display font-black text-white text-3xl sm:text-4xl mb-3">
            What&apos;s on a cut sheet?
          </h1>
          <p className="font-body text-white/70 max-w-lg mx-auto">
            The cut sheet is where you tell our butcher exactly how you want your beef cut. Here&apos;s
            the whole thing — every section, every choice — so you know what to expect before you
            reserve.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
        {/* How it works */}
        <h2 className="font-display font-bold text-2xl text-brand-dark mb-5">
          How you&apos;ll fill it out
        </h2>
        <ol className="space-y-4 mb-12 list-none p-0">
          {STEPS.map((s) => (
            <li key={s.num} className="flex gap-4 bg-white border border-brand-gray-light rounded-2xl p-5">
              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-orange text-white font-display font-bold text-lg flex items-center justify-center">
                {s.num}
              </span>
              <div>
                <h3 className="font-display font-bold text-lg text-brand-dark mb-1">{s.title}</h3>
                <p className="font-body text-brand-gray text-sm leading-relaxed">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* The sample sheet */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <h2 className="font-display font-bold text-2xl text-brand-dark">The sample sheet</h2>
          <span className="inline-block bg-brand-dark text-white font-body text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            Sample — nothing to fill out
          </span>
        </div>
        <p className="font-body text-brand-gray text-sm mb-8 max-w-xl">
          The 14 decisions, in the order the wizard asks them. The{' '}
          <span className="inline-block bg-[#F0F7E8] border border-[#c3dfa0] text-brand-dark font-semibold px-1.5 rounded">
            green tag
          </span>{' '}
          on each shows what the Legacy House Cut picks if you&apos;d rather not decide. Anything you
          decline is never wasted — it becomes ground beef.
        </p>

        {QUARTERS.map((q) => (
          <section key={q} className="mb-10">
            <h3 className="font-body font-semibold text-brand-gray text-xs uppercase tracking-widest mb-3">
              {q}
            </h3>
            <ul className="space-y-3 list-none p-0">
              {SECTIONS.filter((s) => s.quarter === q).map((s) => (
                <li key={s.name} className="bg-white border border-brand-gray-light rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <h4 className="font-display font-bold text-lg text-brand-dark">
                      <span className="mr-2" aria-hidden="true">{s.emoji}</span>
                      {s.name}
                    </h4>
                    <span className="inline-block bg-[#F0F7E8] border border-[#c3dfa0] text-brand-dark font-body text-xs font-semibold px-2.5 py-1 rounded-full">
                      House: {s.houseDefault}
                    </span>
                  </div>
                  <p className="font-body text-brand-gray text-sm mt-1 mb-3">{s.decide}</p>
                  <div className="flex flex-wrap gap-2">
                    {s.options.map((o) => (
                      <span
                        key={o}
                        className="font-body text-xs text-brand-dark border border-brand-gray-light rounded-lg px-2.5 py-1.5 bg-brand-warm"
                      >
                        {o}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* CTA */}
        <div className="bg-brand-dark rounded-2xl p-8 text-center mt-4">
          <h2 className="font-display font-bold text-2xl text-white mb-2">
            That&apos;s the whole thing.
          </h2>
          <p className="font-body text-white/70 text-sm mb-6 max-w-md mx-auto">
            About 10 minutes, one decision at a time, and our butcher cuts your beef exactly the way
            your family eats.
          </p>
          <Link
            href="/weight-explainer"
            className="inline-block bg-brand-orange hover:bg-brand-orange-hover text-white font-body font-bold text-lg px-10 py-4 rounded-xl transition-colors"
          >
            Reserve Your Beef →
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
