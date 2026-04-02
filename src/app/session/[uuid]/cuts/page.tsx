'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  purchase_type: 'whole' | 'half' | 'quarter';
  status: string;
  cut_sheet_role: string;
  group_size: number;
  is_splitting: boolean;
  cut_sheet_complete: boolean;
}

interface CutSheetAnswer {
  section: string;
  answers: Record<string, unknown>;
  completed: boolean;
  locked: boolean;
  custom_request?: string;
}

// ─── Section definitions ───────────────────────────────────────────────────

const SECTIONS = [
  { id: 'chuck', label: 'Chuck', icon: '🥩', cowPart: 'chuck' },
  { id: 'brisket', label: 'Brisket', icon: '🍖', cowPart: 'brisket' },
  { id: 'skirt', label: 'Skirt Steak', icon: '🥩', cowPart: 'skirt' },
  { id: 'rib', label: 'Rib', icon: '🍖', cowPart: 'rib' },
  { id: 'short_ribs', label: 'Short Ribs', icon: '🍖', cowPart: 'short_ribs' },
  { id: 'sirloin', label: 'Sirloin', icon: '🥩', cowPart: 'sirloin' },
  { id: 'round', label: 'Round', icon: '🥩', cowPart: 'round' },
  { id: 'short_loin', label: 'Short Loin', icon: '🥩', cowPart: 'short_loin' },
  { id: 'flank', label: 'Flank', icon: '🥩', cowPart: 'flank' },
  { id: 'stew_meat', label: 'Stew Meat', icon: '🍲', cowPart: null },
  { id: 'tenderized_round', label: 'Tenderized Round', icon: '🥩', cowPart: null },
  { id: 'organs', label: 'Organs', icon: '🫀', cowPart: null },
  { id: 'bones', label: 'Bones', icon: '🦴', cowPart: null },
  { id: 'packing', label: 'Packing Info', icon: '📦', cowPart: null },
];

// ─── SVG Cow Component ────────────────────────────────────────────────────────

function BeefCowDiagram({ 
  activeSection, 
  completedSections,
  onSectionClick 
}: { 
  activeSection: string | null;
  completedSections: string[];
  onSectionClick: (sectionId: string) => void;
}) {
  const getOverlayStyle = (part: string) => {
    const sectionId = SECTIONS.find(s => s.cowPart === part)?.id;
    if (!sectionId) return { fill: 'transparent', opacity: 0 };
    
    const isActive = activeSection === sectionId;
    const isCompleted = completedSections.includes(sectionId);
    
    if (isActive) return { fill: '#E85D24', opacity: 0.5 };
    if (isCompleted) return { fill: '#1A3D2B', opacity: 0.4 };
    return { fill: '#6B7280', opacity: 0.15 };
  };

  const handleClick = (part: string) => {
    const section = SECTIONS.find(s => s.cowPart === part);
    if (section) onSectionClick(section.id);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <img 
        src="/images/beef_cuts.webp" 
        alt="Beef cuts diagram"
        className="w-full h-auto"
      />
      <svg
        viewBox="0 0 500 340"
        className="absolute inset-0 w-full h-full"
        style={{ top: 0, left: 0 }}
      >
        {/* CHUCK — left shoulder area */}
        <rect
          x="82" y="60" width="110" height="160"
          rx="8"
          fill={getOverlayStyle('chuck').fill}
          opacity={getOverlayStyle('chuck').opacity}
          className="cursor-pointer hover:opacity-60 transition-opacity"
          onClick={() => handleClick('chuck')}
        />

        {/* RIB — center upper */}
        <rect
          x="192" y="45" width="105" height="130"
          rx="8"
          fill={getOverlayStyle('rib').fill}
          opacity={getOverlayStyle('rib').opacity}
          className="cursor-pointer hover:opacity-60 transition-opacity"
          onClick={() => handleClick('rib')}
        />

        {/* SHORT LOIN — center upper right */}
        <rect
          x="270" y="45" width="75" height="110"
          rx="8"
          fill={getOverlayStyle('short_loin').fill}
          opacity={getOverlayStyle('short_loin').opacity}
          className="cursor-pointer hover:opacity-60 transition-opacity"
          onClick={() => handleClick('short_loin')}
        />

        {/* SIRLOIN — upper right */}
        <rect
          x="320" y="45" width="75" height="100"
          rx="8"
          fill={getOverlayStyle('sirloin').fill}
          opacity={getOverlayStyle('sirloin').opacity}
          className="cursor-pointer hover:opacity-60 transition-opacity"
          onClick={() => handleClick('sirloin')}
        />

        {/* ROUND — far right */}
        <rect
          x="375" y="55" width="90" height="160"
          rx="8"
          fill={getOverlayStyle('round').fill}
          opacity={getOverlayStyle('round').opacity}
          className="cursor-pointer hover:opacity-60 transition-opacity"
          onClick={() => handleClick('round')}
        />

        {/* BRISKET — lower left chest */}
        <rect
          x="82" y="200" width="100" height="80"
          rx="8"
          fill={getOverlayStyle('brisket').fill}
          opacity={getOverlayStyle('brisket').opacity}
          className="cursor-pointer hover:opacity-60 transition-opacity"
          onClick={() => handleClick('brisket')}
        />

        {/* SHORT RIBS / PLATE — lower center left */}
        <rect
          x="182" y="175" width="90" height="90"
          rx="8"
          fill={getOverlayStyle('short_ribs').fill}
          opacity={getOverlayStyle('short_ribs').opacity}
          className="cursor-pointer hover:opacity-60 transition-opacity"
          onClick={() => handleClick('short_ribs')}
        />

        {/* FLANK — lower center right */}
        <rect
          x="270" y="175" width="105" height="80"
          rx="8"
          fill={getOverlayStyle('flank').fill}
          opacity={getOverlayStyle('flank').opacity}
          className="cursor-pointer hover:opacity-60 transition-opacity"
          onClick={() => handleClick('flank')}
        />

        {/* SKIRT — lower belly strip */}
        <rect
          x="192" y="255" width="175" height="45"
          rx="8"
          fill={getOverlayStyle('skirt').fill}
          opacity={getOverlayStyle('skirt').opacity}
          className="cursor-pointer hover:opacity-60 transition-opacity"
          onClick={() => handleClick('skirt')}
        />
      </svg>

      {/* Legend */}
      <div className="flex gap-4 justify-center mt-2 text-xs text-brand-gray">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-brand-orange inline-block opacity-70"/>Current
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-brand-green inline-block opacity-70"/>Done
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-gray-400 inline-block opacity-70"/>Not started
        </span>
      </div>
    </div>
  );
}

// ─── Duolingo dot path ─────────────────────────────────────────────────────

function SectionDotPath({ 
  sections, 
  currentIndex, 
  completedSections,
  onDotClick
}: {
  sections: typeof SECTIONS;
  currentIndex: number;
  completedSections: string[];
  onDotClick: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap justify-center py-3">
      {sections.map((section, i) => {
        const isCompleted = completedSections.includes(section.id);
        const isCurrent = i === currentIndex;
        return (
          <button
            key={section.id}
            onClick={() => onDotClick(i)}
            className="flex flex-col items-center gap-1 group"
            title={section.label}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
              transition-all duration-200
              ${isCurrent ? 'bg-brand-orange text-white scale-125 shadow-md' : ''}
              ${isCompleted && !isCurrent ? 'bg-brand-green text-white' : ''}
              ${!isCompleted && !isCurrent ? 'bg-brand-gray-light text-brand-gray' : ''}
            `}>
              {isCompleted && !isCurrent ? '✓' : i + 1}
            </div>
            {isCurrent && (
              <span className="text-xs font-semibold text-brand-orange whitespace-nowrap">
                {section.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Intro Screen ─────────────────────────────────────────────────────────────

function IntroScreen({ session, onStart }: { session: Session; onStart: () => void }) {
  const purchaseLabel = session.purchase_type === 'whole' ? 'Whole Beef' : session.purchase_type === 'half' ? 'Half Beef' : 'Quarter Beef';
  const isPartner = session.cut_sheet_role === 'partner';

  return (
    <div className="max-w-[600px] mx-auto px-4 py-10 text-center">
      <div className="text-6xl mb-4">🔪</div>
      <h1 className="font-display font-bold text-3xl text-brand-dark mb-3">
        {isPartner ? 'Review Your Cut Sheet' : 'Build Your Cut Sheet'}
      </h1>
      <p className="text-brand-gray text-base mb-6 leading-relaxed">
        {isPartner
          ? 'Your partner has filled out your shared cut sheet. Review their choices and approve or request changes.'
          : `Tell our butcher exactly how you want your ${purchaseLabel} processed. Every choice is yours — from steak thickness to roast size to what to do with the bones.`
        }
      </p>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-left space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🐄</span>
          <div>
            <p className="font-semibold text-brand-dark">14 sections to complete</p>
            <p className="text-sm text-brand-gray">Chuck, Brisket, Rib, Loin, Round, and more</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-2xl">💾</span>
          <div>
            <p className="font-semibold text-brand-dark">Auto-saves as you go</p>
            <p className="text-sm text-brand-gray">Come back anytime — your progress is saved</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-2xl">🏠</span>
          <div>
            <p className="font-semibold text-brand-dark">House defaults available</p>
            <p className="text-sm text-brand-gray">Not sure? Use our recommended cuts for any section</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="font-semibold text-brand-dark">Locks 1 week before butcher day</p>
            <p className="text-sm text-brand-gray">Edit anytime until then — we&apos;ll email you a reminder</p>
          </div>
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-4 rounded-xl font-semibold text-lg transition-colors"
      >
        {isPartner ? 'Review Cut Sheet →' : 'Get Started →'}
      </button>
    </div>
  );
}

// ─── Section Placeholder (12B will replace these) ────────────────────────────

function SectionForm({
  section,
  answers,
  locked,
  sessionId,
  onSave,
  onNext,
  onPrev,
  isFirst,
  isLast,
}: {
  section: typeof SECTIONS[0];
  answers: Record<string, unknown>;
  locked: boolean;
  sessionId: string;
  onSave: (answers: Record<string, unknown>, completed: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [customRequest, setCustomRequest] = useState('');
  const [customSaved, setCustomSaved] = useState(false);

  const handleUseHouseDefault = () => {
    onSave({ house_default: true }, true);
  };

  const handleCustomRequest = async () => {
    if (!customRequest.trim()) return;
    await fetch(`/api/cut-sheet/${sessionId}/custom-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: section.id, request: customRequest }),
    });
    setCustomSaved(true);
    setTimeout(() => setCustomSaved(false), 3000);
  };

  return (
    <div className="max-w-[600px] mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{section.icon}</span>
          <div>
            <h2 className="font-display font-bold text-xl text-brand-dark">{section.label}</h2>
            {Boolean(answers.house_default) && (
              <span className="text-xs bg-brand-green text-white px-2 py-0.5 rounded-full">Using house default</span>
            )}
          </div>
        </div>

        {locked ? (
          <div className="bg-brand-green-pale border border-green-200 rounded-xl p-4 text-center">
            <p className="text-brand-green font-semibold">🔒 This cut sheet is locked</p>
            <p className="text-sm text-brand-gray mt-1">Your choices have been sent to the butcher</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-brand-warm rounded-xl p-4 text-center border-2 border-dashed border-brand-gray-light">
              <p className="text-brand-gray text-sm mb-2">Section form coming in Block 12B</p>
              <p className="text-xs text-brand-gray">Current answers: {JSON.stringify(answers)}</p>
            </div>

            <button
              onClick={handleUseHouseDefault}
              className="w-full border-2 border-brand-green text-brand-green py-3 rounded-xl font-semibold hover:bg-brand-green-pale transition-colors"
            >
              🏠 Use House Default for {section.label}
            </button>
          </div>
        )}
      </div>

      {/* Custom request */}
      {!locked && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <p className="font-semibold text-brand-dark text-sm mb-2">
            Don&apos;t see your favorite cut?
          </p>
          <textarea
            value={customRequest}
            onChange={(e) => setCustomRequest(e.target.value)}
            placeholder='e.g. "I&apos;d love Denver steaks from the chuck if possible"'
            rows={2}
            className="w-full border border-brand-gray-light rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none"
          />
          <button
            onClick={handleCustomRequest}
            disabled={!customRequest.trim()}
            className="mt-2 px-4 py-2 bg-brand-dark text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {customSaved ? '✓ Sent!' : 'Send Request'}
          </button>
          <p className="text-xs text-brand-gray mt-1">We&apos;ll review and let you know if it&apos;s possible.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {!isFirst && (
          <button onClick={onPrev} className="flex-1 border-2 border-brand-gray-light text-brand-gray py-3 rounded-xl font-semibold">
            ← Previous
          </button>
        )}
        <button
          onClick={onNext}
          className="flex-1 bg-brand-orange hover:bg-brand-orange-hover text-white py-3 rounded-xl font-semibold"
        >
          {isLast ? 'Review & Lock →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────

export default function CutsPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<CutSheetAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const completedSections = answers.filter(a => a.completed).map(a => a.section);

  // Load session and answers
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

      // If answers exist, skip intro and go to first incomplete section
      if (Array.isArray(answersData) && answersData.length > 0) {
        const firstIncomplete = SECTIONS.findIndex(
          s => !answersData.find((a: CutSheetAnswer) => a.section === s.id && a.completed)
        );
        if (firstIncomplete >= 0) setCurrentIndex(firstIncomplete);
        setShowIntro(false);
      }
      setLoading(false);
    }
    load();
  }, [uuid]);

  // Auto-save section answers
  const saveSection = useCallback(async (
    sectionId: string,
    sectionAnswers: Record<string, unknown>,
    completed: boolean
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/cut-sheet/${uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: sectionId, answers: sectionAnswers, completed }),
      });
      const data = await res.json();
      setAnswers(prev => {
        const existing = prev.findIndex(a => a.section === sectionId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });
    } finally {
      setSaving(false);
    }
  }, [uuid]);

  const handleNext = () => {
    if (currentIndex < SECTIONS.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      router.push(`/session/${uuid}/review`);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-brand-warm flex items-center justify-center">
        <p className="text-brand-gray">Session not found.</p>
      </div>
    );
  }

  const currentSection = SECTIONS[currentIndex];
  const currentAnswers = answers.find(a => a.section === currentSection.id);
  const isLocked = currentAnswers?.locked ?? false;

  return (
    <div className="min-h-screen bg-brand-warm">
      {/* Header */}
      <header className="bg-brand-dark px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Image src="/images/LLC_Logo_white.svg" alt="Legacy Land & Cattle" width={100} height={45} className="h-8 w-auto"/>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-white/60 animate-pulse">Saving…</span>}
          <button
            onClick={() => router.push(`/session/${uuid}`)}
            className="text-white/70 hover:text-white text-sm font-medium"
          >
            My Order
          </button>
        </div>
      </header>

      {showIntro ? (
        <IntroScreen session={session} onStart={() => setShowIntro(false)} />
      ) : (
        <>
          {/* Cow diagram */}
          <div className="bg-white border-b border-brand-gray-light px-4 py-4">
            <BeefCowDiagram
              activeSection={currentSection.id}
              completedSections={completedSections}
              onSectionClick={(sectionId) => {
                const idx = SECTIONS.findIndex(s => s.id === sectionId);
                if (idx >= 0) setCurrentIndex(idx);
              }}
            />
          </div>

          {/* Dot path progress */}
          <div className="bg-white border-b border-brand-gray-light px-4">
            <SectionDotPath
              sections={SECTIONS}
              currentIndex={currentIndex}
              completedSections={completedSections}
              onDotClick={setCurrentIndex}
            />
          </div>

          {/* Section form */}
          <SectionForm
            section={currentSection}
            answers={currentAnswers?.answers ?? {}}
            locked={isLocked}
            sessionId={uuid}
            onSave={(sectionAnswers, completed) => saveSection(currentSection.id, sectionAnswers, completed)}
            onNext={handleNext}
            onPrev={handlePrev}
            isFirst={currentIndex === 0}
            isLast={currentIndex === SECTIONS.length - 1}
          />
        </>
      )}
    </div>
  );
}
