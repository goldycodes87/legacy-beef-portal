'use client';

import { useState } from 'react';

const QUESTIONS: { q: string; a: string }[] = [
  {
    q: 'How much freezer space do I actually need?',
    a: 'A half beef needs roughly 8 cubic feet — about a small chest freezer. A quarter fits in most upright freezers alongside your normal food. A whole wants a dedicated chest freezer. The video above shows exactly what it looks like packed.',
  },
  {
    q: 'How long will it keep?',
    a: 'Vacuum sealed and kept frozen, a year and a half comfortably. Most families work through a half in eight to twelve months, so you will be finishing it around the time the next harvest opens.',
  },
  {
    q: "What if I don't want a cut, like liver or soup bones?",
    a: 'Leave it off your cut sheet and you will not get it. Anything you decline gets made into ground beef instead, so nothing is wasted and nothing is lost from your share.',
  },
  {
    q: 'Can I split a share with someone?',
    a: 'Yes, and people do it every harvest. You each get your own contract, your own cut sheet and your own pickup, and you each pay your own deposit. Splitting a whole beef also unlocks a custom cut sheet at the better whole-beef price.',
  },
  {
    q: 'Do I have to pay by card?',
    a: 'No. Cash and check are welcome for both the deposit and the balance — choose that at checkout and we will hold your spot. Cards carry a processing fee; cash and check do not.',
  },
  {
    q: "Why isn't the final price exact up front?",
    a: 'Because animals are not identical. You pay per pound of hanging weight, and nobody knows that number until the animal is harvested and hung. You know the price per pound before you pay anything, and you see the final weight and total before the balance is due.',
  },
  {
    q: 'When do I get the pickup address?',
    a: 'As soon as your beef is ready. We email you to schedule a pickup window and the address comes with it. Everything before that happens by email and phone.',
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="max-w-[760px] mx-auto">
      <h2 className="font-display font-bold text-3xl text-brand-dark text-center mb-2">FAQ</h2>
      <p className="font-body text-brand-gray text-center mb-8">
        The questions we get asked most.
      </p>

      <div>
        {QUESTIONS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="border-b border-brand-gray-light">
              <h3>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full text-left py-4 flex justify-between items-center gap-5 font-body font-semibold text-brand-dark hover:text-brand-orange transition-colors"
                >
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className={`text-brand-orange text-xl leading-none flex-shrink-0 transition-transform ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
              </h3>
              {isOpen && (
                <p className="font-body text-brand-gray text-sm leading-relaxed pb-5 max-w-[64ch]">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
