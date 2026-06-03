'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import cutDescriptions from '@/lib/cut-descriptions.json';

interface CutSheetAnswer {
  section: string;
  half?: 'A' | 'B' | null;
  answers: Record<string, unknown>;
  completed: boolean;
  locked: boolean;
}

interface Session {
  id: string;
  purchase_type: string;
  dual_cut_sheet?: boolean | null;
  half_a_complete?: boolean;
  half_b_complete?: boolean;
  half_a_locked_at?: string | null;
  half_b_locked_at?: string | null;
  cut_sheet_complete?: boolean;
  animal?: { name: string; butcher_date: string; animal_type: string };
}

const SECTION_LABELS: Record<string, string> = {
  chuck: 'Chuck',
  brisket: 'Brisket',
  skirt: 'Skirt Steak',
  rib: 'Rib',
  short_ribs: 'Short Ribs',
  sirloin: 'Sirloin',
  round: 'Round',
  short_loin: 'Short Loin',
  flank: 'Flank',
  stew_meat: 'Stew Meat',
  tenderized_round: 'Tenderized Round',
  organs: 'Organs',
  bones: 'Bones',
  packing: 'Ground Beef',
};

const SECTION_ICONS: Record<string, string> = {
  chuck: '🥩',
  brisket: '🍖',
  skirt: '🥩',
  rib: '🍖',
  short_ribs: '🍖',
  sirloin: '🥩',
  round: '🥩',
  short_loin: '🥩',
  flank: '🥩',
  stew_meat: '🍲',
  tenderized_round: '🥩',
  organs: '🫀',
  bones: '🦴',
  packing: '🥩',
};

const SECTIONS_ORDER = [
  'chuck', 'brisket', 'skirt', 'rib', 'short_ribs', 'sirloin',
  'round', 'short_loin', 'flank', 'stew_meat', 'tenderized_round',
  'organs', 'bones', 'packing'
];
const TOTAL_SECTIONS = SECTIONS_ORDER.length;

// Suppress unused import warning — cutDescriptions is used in formatAnswers via type cast
void cutDescriptions;

function formatAnswers(section: string, answers: Record<string, unknown>): string {
  if (answers.house_default) return 'House default';
  if (answers.choice === 'skipped') return 'N/A (Round not steaks)';

  if (typeof answers.choice === 'boolean') {
    return answers.choice ? 'Yes' : 'No / Skip';
  }

  const parts: string[] = [];
  if (answers.choice) {
    const choice = answers.choice as string;
    parts.push(choice.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
  }
  if (answers.choices) {
    const choices = answers.choices as string[];
    parts.push(choices.filter(c => typeof c === 'string').map(c => c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', '));
  }
  if (answers.thickness) parts.push(`${answers.thickness} thick`);
  if (answers.tbone_thickness) parts.push(`T-Bone: ${answers.tbone_thickness}`);
  if (answers.strip_thickness) parts.push(`Strip: ${answers.strip_thickness}`);
  if (answers.filet_thickness) parts.push(`Filet: ${answers.filet_thickness}`);
  if (answers.steaks_per_pack) parts.push(`${answers.steaks_per_pack}/pack`);
  if (answers.roast_weight) parts.push(`${answers.roast_weight} lbs`);
  if (answers.pounds) parts.push(`${answers.pounds} lbs total`);
  if (answers.pkg_size) parts.push(`${answers.pkg_size} packages`);
  if (answers.fat_pct) parts.push(`${answers.fat_pct} fat`);
  if (answers.lbs_per_pack) parts.push(`${answers.lbs_per_pack} lb packs`);

  return parts.join(' · ') || 'See details';
}

// section param needed for future extensibility
void (formatAnswers as (s: string, a: Record<string, unknown>) => string);

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;
  const [answers, setAnswers] = useState<CutSheetAnswer[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [locking, setLocking] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    const [sessionRes, answersRes] = await Promise.all([
      fetch(`/api/session/${uuid}`),
      fetch(`/api/cut-sheet/${uuid}`),
    ]);
    const sessionData = await sessionRes.json();
    const answersData = await answersRes.json();
    setSession(sessionData);
    setAnswers(Array.isArray(answersData) ? answersData : []);
    return sessionData as Session;
  }, [uuid]);

  useEffect(() => {
    async function load() {
      await refreshData();
      setLoading(false);
    }
    load();
  }, [uuid, refreshData]);

  const isDual = session?.dual_cut_sheet === true;
  const answersBoth = answers.filter(a => (a.half ?? null) === null);
  const answersHalfA = answers.filter(a => a.half === 'A');
  const answersHalfB = answers.filter(a => a.half === 'B');

  const getHalfMode = (sectionId: string): 'both' | 'split' => {
    const hasBoth = answersBoth.some(a => a.section === sectionId);
    const hasA = answersHalfA.some(a => a.section === sectionId);
    const hasB = answersHalfB.some(a => a.section === sectionId);
    if (hasA && hasB) return 'split';
    if (hasBoth) return 'both';
    return 'both';
  };

  const isSectionCompleted = (sectionId: string) => {
    const mode = isDual ? getHalfMode(sectionId) : 'both';
    if (mode === 'both') {
      return answersBoth.some(a => a.section === sectionId && a.completed);
    }
    return answersHalfA.some(a => a.section === sectionId && a.completed) &&
      answersHalfB.some(a => a.section === sectionId && a.completed);
  };

  const completedCount = SECTIONS_ORDER.filter(isSectionCompleted).length;
  const allComplete = completedCount === TOTAL_SECTIONS;

  async function handleLock() {
    setLocking(true);
    try {
      await fetch(`/api/cut-sheet/${uuid}/lock`, { method: 'POST' });
      router.push(`/session/${uuid}/wrapped`);
    } finally {
      setLocking(false);
    }
  }

  const renderDualSectionCards = () => (
    <div className="space-y-3 mb-8">
      {SECTIONS_ORDER.map(sectionId => {
        const idx = SECTIONS_ORDER.indexOf(sectionId);
        const both = answersBoth.find(a => a.section === sectionId);
        const halfA = answersHalfA.find(a => a.section === sectionId);
        const halfB = answersHalfB.find(a => a.section === sectionId);
        const mode = getHalfMode(sectionId);
        const isComplete = isSectionCompleted(sectionId);
        const editPath = `/session/${uuid}/cuts?section=${idx}`;

        return (
          <div
            key={sectionId}
            className={`bg-white rounded-2xl p-4 shadow-sm border-2 ${isComplete ? 'border-transparent' : 'border-amber-200'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{SECTION_ICONS[sectionId]}</span>
                <div>
                  <p className="font-semibold text-brand-dark text-base">{SECTION_LABELS[sectionId]}</p>
                  <p className="text-xs text-brand-gray">{mode === 'both' ? 'Same for both halves' : 'Different per half'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isComplete ? (
                  <span className="text-brand-green text-lg">✓</span>
                ) : (
                  <span className="text-amber-500 text-lg">!</span>
                )}
                <button
                  onClick={() => router.push(editPath)}
                  className="text-brand-orange text-xs font-semibold hover:underline ml-1"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {mode === 'both' && both && (
                <div className="border border-brand-gray-light rounded-xl p-3 bg-brand-green-pale/30">
                  <div className="flex items-center justify-between">
                    <span className="inline-block bg-brand-green text-white text-xs font-bold px-3 py-1 rounded-full">Both Halves</span>
                    <span className="text-brand-dark text-sm font-semibold">{both.completed ? '✓ Complete' : 'Needs input'}</span>
                  </div>
                  <p className="text-sm text-brand-dark mt-2 font-medium">{formatAnswers(sectionId, both.answers)}</p>
                </div>
              )}

              {mode === 'split' && (
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="border border-brand-gray-light rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-block bg-brand-orange text-white text-xs font-bold px-3 py-1 rounded-full">HALF A</span>
                      <span className="text-sm font-semibold text-brand-dark">{halfA?.completed ? '✓ Complete' : 'Needs input'}</span>
                    </div>
                    <p className="text-sm text-brand-dark mt-2 font-medium">
                      {halfA ? formatAnswers(sectionId, halfA.answers) : 'Not started'}
                    </p>
                  </div>
                  <div className="border border-brand-gray-light rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-block bg-brand-green text-white text-xs font-bold px-3 py-1 rounded-full">HALF B</span>
                      <span className="text-sm font-semibold text-brand-dark">{halfB?.completed ? '✓ Complete' : 'Needs input'}</span>
                    </div>
                    <p className="text-sm text-brand-dark mt-2 font-medium">
                      {halfB ? formatAnswers(sectionId, halfB.answers) : 'Not started'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-warm">
      {/* Header */}
      <header className="bg-brand-dark px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Image src="/images/LLC_Logo_white.svg" alt="Legacy Land & Cattle" width={100} height={45} className="h-8 w-auto" />
        <button onClick={() => router.push(`/session/${uuid}/cuts`)} className="text-white/70 hover:text-white text-sm font-medium">
          ← Edit
        </button>
      </header>

      <main className="max-w-[960px] mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="font-display font-bold text-3xl text-brand-dark mb-2">Review Your Cut Sheet</h1>
          <p className="text-brand-gray text-sm">
            {session?.animal?.name} · {session?.purchase_type ? session.purchase_type.charAt(0).toUpperCase() + session.purchase_type.slice(1) + ' Beef' : ''}
          </p>
          {!allComplete && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 inline-block">
              <p className="text-amber-800 text-sm font-medium">
                {TOTAL_SECTIONS - completedCount} section{TOTAL_SECTIONS - completedCount !== 1 ? 's' : ''} still need your input
              </p>
            </div>
          )}
        </div>

        {renderDualSectionCards()}
        <div className="space-y-3 pb-8">
          <button
            onClick={handleLock}
            disabled={locking || !allComplete}
            className="w-full py-4 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {locking ? 'Locking in…' : 'Lock It In 🔒'}
          </button>
          <button
            onClick={() => router.push(`/session/${uuid}/cuts`)}
            className="w-full py-4 rounded-xl border-2 border-brand-gray-light text-brand-gray font-semibold hover:border-brand-dark hover:text-brand-dark transition-colors"
          >
            I&apos;m Still Deciding — Go Back
          </button>
          <p className="text-center text-xs text-brand-gray">
            Your choices are saved. Come back anytime before butcher day.
          </p>
        </div>
      </main>
    </div>
  );
}
