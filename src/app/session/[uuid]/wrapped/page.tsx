'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

// 5 rotating "Did you know" fun facts based on their ground beef pounds
const DID_YOU_KNOW = [
  (lbs: number) => `With ~${Math.round(lbs * 0.4)} lbs of ground beef, you could make approximately ${Math.round(lbs * 0.4 / 0.25)} tacos. Taco Tuesday just got serious. 🌮`,
  (lbs: number) => `Your ground beef could make ${Math.round(lbs * 0.4 / 0.33)} quarter-pound burgers. That's a lot of backyard BBQs. 🍔`,
  (lbs: number) => `${Math.round(lbs * 0.4)} lbs of ground beef makes approximately ${Math.round(lbs * 0.4 / 1.5)} batches of spaghetti bolognese. Dinner's covered for months. 🍝`,
  (lbs: number) => `You could make roughly ${Math.round(lbs * 0.4 / 0.2)} meatballs with your ground beef. That's a lot of marinara. 🍝`,
  (lbs: number) => `Your ground beef could make about ${Math.round(lbs * 0.4 / 2)} family-sized meatloaves. Sunday dinners sorted. 🥩`,
];

// Cattle images for cards — use existing assets
const CARD_IMAGES = [
  '/images/hero_pasture.jpg',
  '/images/hero_pasture.jpg',
  '/images/hero_pasture.jpg',
];

interface Session {
  id: string;
  purchase_type: 'whole' | 'half' | 'quarter';
  animal?: { name: string; butcher_date: string; animal_type: string; price_per_lb: number };
}

interface CutSheetAnswer {
  section: string;
  answers: Record<string, unknown>;
  completed: boolean;
}

const ANIMAL_TYPE_LABELS: Record<string, string> = {
  grass_fed: 'Grass-Fed',
  grain_finished: 'Grain-Finished',
  wagyu: 'American Wagyu',
};

const WEIGHT_RANGES: Record<string, string> = {
  whole: '390–465',
  half: '195–235',
  quarter: '98–118',
};

export default function WrappedPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<CutSheetAnswer[]>([]);
  const [currentCard, setCurrentCard] = useState(-1); // -1 = intro
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [sessionRes, answersRes] = await Promise.all([
        fetch(`/api/session/${uuid}`),
        fetch(`/api/cut-sheet/${uuid}`),
      ]);
      const sessionData = await sessionRes.json();
      const answersData = await answersRes.json();
      setSession(sessionData);
      setAnswers(Array.isArray(answersData) ? answersData : []);
      setLoading(false);
    }
    load();
  }, [uuid]);

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Computed stats
  const customizedCount = answers.filter(a => a.completed && !a.answers.house_default && a.answers.choice !== 'skipped').length;
  const butcherDate = session.animal?.butcher_date ? new Date(session.animal.butcher_date + 'T00:00:00') : null;
  const daysUntil = butcherDate ? Math.ceil((butcherDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const weightRange = WEIGHT_RANGES[session.purchase_type] || '195–235';
  const animalTypeLabel = ANIMAL_TYPE_LABELS[session.animal?.animal_type || 'grass_fed'];

  // Estimate ground beef lbs (rough: 30% of finished weight goes to grind)
  const avgWeight = session.purchase_type === 'whole' ? 427 : session.purchase_type === 'half' ? 215 : 108;
  const estimatedGroundLbs = Math.round(avgWeight * 0.3);
  const didYouKnowIndex = Math.floor(Math.random() * DID_YOU_KNOW.length);
  const funFact = DID_YOU_KNOW[didYouKnowIndex](avgWeight);

  // Cards to show in sequence
  const cards = [
    {
      bg: 'from-brand-green to-[#0d2518]',
      image: CARD_IMAGES[0],
      content: (
        <div className="text-center space-y-4">
          <p className="text-white/60 text-sm uppercase tracking-widest font-semibold">You customized</p>
          <p className="text-8xl font-bold text-brand-orange">{customizedCount}</p>
          <p className="text-white text-xl font-semibold">cuts on your order</p>
          <p className="text-white/60 text-sm">Every single one tells the butcher exactly what you want.</p>
        </div>
      ),
    },
    {
      bg: 'from-[#1a1a2e] to-[#16213e]',
      image: CARD_IMAGES[1],
      content: (
        <div className="text-center space-y-4">
          <p className="text-white/60 text-sm uppercase tracking-widest font-semibold">Headed your way</p>
          <p className="text-5xl font-bold text-brand-orange">~{weightRange} lbs</p>
          <p className="text-white text-xl font-semibold">of {animalTypeLabel} beef</p>
          <p className="text-white/60 text-sm">Straight from our ranch in Black Forest, Colorado.</p>
        </div>
      ),
    },
    {
      bg: 'from-[#2d1b00] to-[#1a0f00]',
      image: CARD_IMAGES[2],
      content: (
        <div className="text-center space-y-4">
          <p className="text-white/60 text-sm uppercase tracking-widest font-semibold">Butcher day in</p>
          <p className="text-8xl font-bold text-brand-orange">{daysUntil}</p>
          <p className="text-white text-xl font-semibold">days</p>
          <p className="text-white/60 text-sm">
            {butcherDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      ),
    },
    {
      bg: 'from-[#1e0a30] to-[#0d0520]',
      image: null,
      content: (
        <div className="text-center space-y-4 px-4">
          <p className="text-4xl">💡</p>
          <p className="text-white/60 text-sm uppercase tracking-widest font-semibold">Did you know?</p>
          <p className="text-white text-lg font-medium leading-relaxed">{funFact}</p>
        </div>
      ),
    },
    {
      bg: 'from-brand-dark to-[#1a1a1a]',
      image: null,
      content: (
        <div className="text-center space-y-6">
          <Image
            src="/images/LLC_Logo_white.svg"
            alt="Legacy Land & Cattle"
            width={220}
            height={100}
            className="h-20 w-auto mx-auto"
          />
          <div className="space-y-2">
            <p className="text-white text-2xl font-display font-bold">Your beef is locked in.</p>
            <p className="text-white/70 text-base">We&apos;ll take it from here.</p>
          </div>
          <div className="bg-brand-green rounded-2xl p-5 text-left space-y-2">
            <p className="text-white font-semibold text-sm">What happens next?</p>
            <p className="text-white/80 text-sm leading-relaxed">
              We send your cut sheet to T-K Processing before butcher day. You&apos;ll get an email when your beef is ready with your final balance and pickup options.
            </p>
          </div>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'I just locked in my beef order!',
                  text: `Just reserved ${session.purchase_type} ${animalTypeLabel} beef from Legacy Land & Cattle — custom cut, straight from a Colorado ranch. 🐄`,
                  url: window.location.origin,
                });
              }
            }}
            className="w-full py-4 rounded-xl bg-brand-orange text-white font-semibold text-base"
          >
            Share with Friends 🐄
          </button>
          <button
            onClick={() => router.push(`/session/${uuid}`)}
            className="w-full py-3 rounded-xl border border-white/20 text-white/60 text-sm font-medium"
          >
            View My Order
          </button>
        </div>
      ),
    },
  ];

  // Intro screen
  if (currentCard === -1) {
    return (
      <div
        className="min-h-screen bg-brand-dark flex flex-col items-center justify-center px-4 text-center"
        onClick={() => setCurrentCard(0)}
      >
        <div className="animate-bounce mb-6">
          <span className="text-6xl">🎉</span>
        </div>
        <h1 className="font-display font-bold text-4xl text-white mb-3">
          Your Cut Sheet
          <br />
          is Locked!
        </h1>
        <p className="text-white/60 text-base mb-10">
          Your order is headed to the butcher exactly how you want it.
        </p>
        <div className="animate-pulse">
          <p className="text-white/40 text-sm">Tap anywhere to see your recap</p>
        </div>
      </div>
    );
  }

  const card = cards[currentCard];
  const isLast = currentCard === cards.length - 1;

  return (
    <div
      className={`min-h-screen bg-gradient-to-b ${card.bg} flex flex-col transition-all duration-500`}
      onClick={!isLast ? () => setCurrentCard(c => c + 1) : undefined}
    >
      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center pt-8 px-4">
        {cards.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full flex-1 transition-all duration-300 ${
              i <= currentCard ? 'bg-white' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Background image if present */}
      {card.image && (
        <div className="absolute inset-0 z-0">
          <img src={card.image} alt="" className="w-full h-full object-cover opacity-20" />
        </div>
      )}

      {/* Card content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-[slideUp_0.4s_ease-out]">
          {card.content}
        </div>
      </div>

      {/* Tap hint */}
      {!isLast && (
        <div className="relative z-10 pb-8 text-center">
          <p className="text-white/30 text-xs">Tap to continue</p>
        </div>
      )}
    </div>
  );
}
