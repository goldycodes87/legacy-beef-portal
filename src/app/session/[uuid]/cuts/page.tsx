'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import cutDescriptions from '@/lib/cut-descriptions.json';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  purchase_type: 'whole' | 'half' | 'quarter';
  status: string;
  cut_sheet_role: string;
  group_size: number;
  is_splitting: boolean;
  cut_sheet_complete: boolean;
  animal?: {
    butcher_date?: string;
  };
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

// ─── House Defaults ────────────────────────────────────────────────────────

const HOUSE_DEFAULTS: Record<string, Record<string, unknown>> = {
  chuck: { choice: 'steaks', thickness: '1"', steaks_per_pack: 2 },
  brisket: { choice: 'yes_whole' },
  skirt: { choice: 'yes' },
  rib: { choice: 'bone_in_steaks', thickness: '1.25"', steaks_per_pack: 2 },
  short_ribs: { choice: 'yes' },
  sirloin: { choice: 'steaks', thickness: '1"', steaks_per_pack: 2 },
  round: { choice: 'grind' },
  short_loin: { choice: 'tbone', thickness: '1"', steaks_per_pack: 2 },
  flank: { choice: 'yes' },
  stew_meat: { choice: 'no' },
  tenderized_round: { choice: 'no' },
  organs: { choice: ['none'] },
  bones: { choice: 'soup' },
  packing: { fat_pct: '85/15', lbs_per_pack: 1, packages: 5 },
};

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
  const getStyle = (sectionId: string) => {
    const isActive = activeSection === sectionId;
    const isCompleted = completedSections.includes(sectionId);
    if (isActive) return { fill: '#E85D24', opacity: 0.6 };
    if (isCompleted) return { fill: '#1A3D2B', opacity: 0.5 };
    return { fill: 'transparent', opacity: 0 };
  };

  const regions = [
    { id: 'chuck', path: 'M240,56 L239,101 L239,142 L243,175 L131,165 L144,116 L153,93 L174,55 Z' },
    { id: 'rib', path: 'M248,56 L293,58 L355,65 L363,106 L364,161 L365,185 L246,174 L243,120 Z' },
    { id: 'short_loin', path: 'M360,65 L428,63 L433,86 L440,89 L497,86 L503,111 L437,114 L437,151 L432,195 L402,187 L370,186 L371,122 Z' },
    { id: 'sirloin', path: 'M433,61 L460,55 L493,51 L499,83 L463,82 L437,86 Z' },
    { id: 'sirloin', path: 'M442,119 L442,144 L440,172 L437,197 L465,209 L484,223 L504,238 L509,198 L509,148 L502,116 Z' },
    { id: 'round', path: 'M497,53 L508,118 L513,169 L514,211 L507,238 L536,245 L569,241 L567,183 L571,146 L575,103 L547,98 L535,78 L531,55 Z' },
    { id: 'brisket', path: 'M131,170 L241,180 L249,212 L259,245 L217,246 L194,251 L179,258 L157,245 L143,223 L130,186 Z' },
    { id: 'short_ribs', path: 'M248,181 L258,226 L362,235 L364,191 Z' },
    { id: 'flank', path: 'M369,190 L366,253 L397,254 L432,243 L457,260 L490,275 L504,243 L465,217 L435,201 Z' },
    { id: 'skirt', path: 'M258,228 L265,244 L295,243 L337,250 L360,254 L361,236 Z' },
    { id: 'bones', path: 'M183,260 L219,253 L257,250 L260,266 L263,282 L260,331 L238,333 L233,307 L223,281 L216,303 L214,328 L190,328 L191,285 L191,268 Z' },
    { id: 'bones', path: 'M507,243 L533,249 L570,245 L575,273 L568,333 L544,339 L545,303 L530,279 L520,301 L505,335 L483,335 L491,304 L489,282 L504,259 Z' },
  ];

  return (
    <div className="w-full max-w-lg mx-auto select-none">
      <svg
        viewBox="0 0 600 395"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <image
          href="/images/beef_cuts.webp"
          width="600"
          height="395"
          preserveAspectRatio="xMidYMid meet"
        />
        {regions.map((region, i) => (
          <path
            key={`${region.id}-${i}`}
            d={region.path}
            className="cursor-pointer transition-all duration-200"
            style={{
              fill: getStyle(region.id).fill,
              opacity: getStyle(region.id).opacity,
            }}
            onClick={() => onSectionClick(region.id)}
          />
        ))}
      </svg>
      <div className="flex gap-4 justify-center mt-1 text-xs text-brand-gray">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block bg-brand-orange opacity-80"/>Current
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block bg-brand-green opacity-80"/>Done
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block bg-gray-400 opacity-80"/>Hover to explore
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

// ─── Reusable Sub-Components ──────────────────────────────────────────────────

function ConfirmationMessage({ text }: { text: string }) {
  return (
    <div className="mt-4 p-4 bg-brand-green-pale border border-green-200 rounded-xl">
      <p className="text-brand-green text-sm font-medium">✓ {text}</p>
    </div>
  );
}

function YesNoSelector({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {([true, false] as boolean[]).map((v) => (
        <button
          key={String(v)}
          onClick={() => onChange(v)}
          className={`py-4 rounded-xl font-semibold border-2 transition-all ${
            value === v
              ? 'border-brand-orange bg-brand-orange-light text-brand-orange'
              : 'border-brand-gray-light bg-white text-brand-dark hover:border-brand-orange/50'
          }`}
        >
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );
}

function OptionSelector({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: { id: string; label: string; description?: string }[];
  value: string | string[] | null;
  onChange: (v: string | string[]) => void;
  multi?: boolean;
}) {
  const isSelected = (id: string) =>
    multi ? ((value as string[]) || []).includes(id) : value === id;

  const handleClick = (id: string) => {
    if (multi) {
      const current = (value as string[]) || [];
      onChange(current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
    } else {
      onChange(id);
    }
  };

  return (
    <div className="space-y-2">
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => handleClick(opt.id)}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
            isSelected(opt.id)
              ? 'border-brand-orange bg-brand-orange-light'
              : 'border-brand-gray-light bg-white hover:border-brand-orange/50'
          }`}
        >
          <p className="font-semibold text-brand-dark text-sm">{opt.label}</p>
          {opt.description && <p className="text-xs text-brand-gray mt-0.5">{opt.description}</p>}
          {isSelected(opt.id) && <span className="text-brand-orange text-xs font-bold">✓ Selected</span>}
        </button>
      ))}
    </div>
  );
}

function ThicknessSelector({ value, onChange, label = 'Thickness' }: { value: string; onChange: (v: string) => void; label?: string }) {
  const options = ['3/4"', '1"', '1.25"', '1.5"'];
  return (
    <div>
      <label className="block text-sm font-semibold text-brand-dark mb-2">{label}</label>
      <div className="grid grid-cols-4 gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
              value === opt
                ? 'border-brand-orange bg-brand-orange-light text-brand-orange'
                : 'border-brand-gray-light bg-white text-brand-dark hover:border-brand-orange/50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function SteaksPerPackSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-brand-dark mb-2">Steaks per pack <span className="text-brand-gray font-normal">(house default: 2)</span></label>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
              value === n
                ? 'border-brand-orange bg-brand-orange-light text-brand-orange'
                : 'border-brand-gray-light bg-white text-brand-dark hover:border-brand-orange/50'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function RoastWeightSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = [
    { id: '2-3', label: '2–3 lbs', description: 'Feeds ~4 people, great for smaller families' },
    { id: '3-4', label: '3–4 lbs', description: 'Sweet spot for most families of 4–6' },
    { id: '4-5', label: '4–5 lbs', description: "Big roast — make sure you've got hungry people coming" },
  ];
  return (
    <div>
      <label className="block text-sm font-semibold text-brand-dark mb-2">Roast size</label>
      <div className="space-y-2">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
              value === opt.id
                ? 'border-brand-orange bg-brand-orange-light'
                : 'border-brand-gray-light bg-white hover:border-brand-orange/50'
            }`}
          >
            <p className="font-semibold text-brand-dark text-sm">{opt.label}</p>
            <p className="text-xs text-brand-gray">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── getSectionContent ────────────────────────────────────────────────────────

function getSectionContent(
  section: typeof SECTIONS[0],
  answers: Record<string, unknown>,
  onUpdate: (newAnswers: Record<string, unknown>, completed: boolean) => void,
) {
  const intro = (cutDescriptions as Record<string, { intro?: string }>)[section.id]?.intro || '';

  // ─── SECTION 1: CHUCK ───
  if (section.id === 'chuck') {
    const choice = answers.choice as string | undefined;
    const thickness = (answers.thickness as string) || '1"';
    const steaksPerPack = (answers.steaks_per_pack as number) || 2;
    const cd = cutDescriptions.chuck;

    return (
      <div className="space-y-4">
        <p className="text-brand-gray text-sm leading-relaxed mb-4">{intro}</p>
        <OptionSelector
          options={[
            { id: 'roasts', label: 'Roasts' },
            { id: 'steaks', label: 'Steaks' },
            { id: 'grind', label: 'Ground Beef' },
          ]}
          value={choice ?? null}
          onChange={(v) => {
            const newAnswers: Record<string, unknown> = { choice: v };
            if (v === 'steaks') {
              newAnswers.thickness = thickness;
              newAnswers.steaks_per_pack = steaksPerPack;
            } else if (v === 'roasts') {
              newAnswers.roast_weight = answers.roast_weight || '3-4';
            }
            onUpdate(newAnswers, !!v);
          }}
        />
        {choice === 'steaks' && (
          <>
            <ThicknessSelector value={thickness} onChange={(v) => onUpdate({ ...answers, thickness: v }, !!choice)} />
            <SteaksPerPackSelector value={steaksPerPack} onChange={(v) => onUpdate({ ...answers, steaks_per_pack: v }, !!choice)} />
          </>
        )}
        {choice === 'roasts' && (
          <RoastWeightSelector value={(answers.roast_weight as string) || '3-4'} onChange={(v) => onUpdate({ ...answers, roast_weight: v }, !!choice)} />
        )}
        {choice && (
          <ConfirmationMessage text={cd.choices[choice as keyof typeof cd.choices] ?? ''} />
        )}
      </div>
    );
  }

  // ─── SECTION 2: BRISKET ───
  if (section.id === 'brisket') {
    const choice = answers.choice as string | undefined;
    const cd = cutDescriptions.brisket;
    return (
      <div className="space-y-4">
        <p className="text-brand-gray text-sm leading-relaxed mb-4">{intro}</p>
        <OptionSelector
          options={[
            { id: 'yes_whole', label: 'Whole Brisket' },
            { id: 'yes_half', label: 'Half Brisket' },
            { id: 'no', label: 'Skip Brisket' },
          ]}
          value={choice ?? null}
          onChange={(v) => onUpdate({ choice: v }, !!v)}
        />
        {choice && (
          <ConfirmationMessage text={cd.choices[choice as keyof typeof cd.choices] ?? ''} />
        )}
      </div>
    );
  }

  // ─── SECTION 3: SKIRT ───
  if (section.id === 'skirt') {
    const choice = (answers.choice as boolean | undefined) !== undefined ? (answers.choice as boolean) : null;
    const cd = cutDescriptions.skirt;
    return (
      <div className="space-y-4">
        <p className="text-brand-gray text-sm leading-relaxed mb-4">{intro}</p>
        <YesNoSelector
          value={choice}
          onChange={(v) => onUpdate({ choice: v }, true)}
        />
        {choice !== null && (
          <ConfirmationMessage text={cd.choices[choice ? 'yes' : 'no']} />
        )}
      </div>
    );
  }

  // ─── SECTION 4: RIB ───
  if (section.id === 'rib') {
    const choice = answers.choice as string | undefined;
    const thickness = (answers.thickness as string) || '1.25"';
    const steaksPerPack = (answers.steaks_per_pack as number) || 2;
    const cd = cutDescriptions.rib;

    return (
      <div className="space-y-4">
        <p className="text-brand-gray text-sm leading-relaxed mb-4">{intro}</p>
        <OptionSelector
          options={[
            { id: 'bone_in_roast', label: 'Bone-In Roast' },
            { id: 'boneless_roast', label: 'Boneless Roast' },
            { id: 'bone_in_steaks', label: 'Bone-In Steaks' },
            { id: 'boneless_steaks', label: 'Boneless Steaks' },
          ]}
          value={choice ?? null}
          onChange={(v) => {
            const s = v as string;
            const newAnswers: Record<string, unknown> = { choice: s };
            if (s?.includes('roast')) {
              newAnswers.roast_weight = answers.roast_weight || '3-4';
            } else if (s?.includes('steaks')) {
              newAnswers.thickness = thickness;
              newAnswers.steaks_per_pack = steaksPerPack;
            }
            onUpdate(newAnswers, !!s);
          }}
        />
        {choice?.includes('roast') && (
          <RoastWeightSelector value={(answers.roast_weight as string) || '3-4'} onChange={(v) => onUpdate({ ...answers, roast_weight: v }, !!choice)} />
        )}
        {choice?.includes('steaks') && (
          <>
            <ThicknessSelector value={thickness} onChange={(v) => onUpdate({ ...answers, thickness: v }, !!choice)} />
            <SteaksPerPackSelector value={steaksPerPack} onChange={(v) => onUpdate({ ...answers, steaks_per_pack: v }, !!choice)} />
          </>
        )}
        {choice && (
          <ConfirmationMessage text={cd.choices[choice as keyof typeof cd.choices] ?? ''} />
        )}
      </div>
    );
  }

  // ─── SECTION 5: SHORT_RIBS ───
  if (section.id === 'short_ribs') {
    const choice = (answers.choice as boolean | undefined) !== undefined ? (answers.choice as boolean) : null;
    const cd = cutDescriptions.short_ribs;
    return (
      <div className="space-y-4">
        <p className="text-brand-gray text-sm leading-relaxed mb-4">{intro}</p>
        <YesNoSelector
          value={choice}
          onChange={(v) => onUpdate({ choice: v }, true)}
        />
        {choice !== null && (
          <ConfirmationMessage text={cd.choices[choice ? 'yes' : 'no']} />
        )}
      </div>
    );
  }

  // ─── SECTION 6: SIRLOIN ───
  if (section.id === 'sirloin') {
    const choice = answers.choice as string | undefined;
    const thickness = (answers.thickness as string) || '1"';
    const steaksPerPack = (answers.steaks_per_pack as number) || 2;
    const cd = cutDescriptions.sirloin;

    return (
      <div className="space-y-4">
        <p className="text-brand-gray text-sm leading-relaxed mb-4">{intro}</p>
        <OptionSelector
          options={[
            { id: 'roasts', label: 'Roasts' },
            { id: 'steaks', label: 'Steaks' },
            { id: 'grind', label: 'Ground Beef' },
          ]}
          value={choice ?? null}
          onChange={(v) => {
            const newAnswers: Record<string, unknown> = { choice: v };
            if (v === 'steaks') {
              newAnswers.thickness = thickness;
              newAnswers.steaks_per_pack = steaksPerPack;
            } else if (v === 'roasts') {
              newAnswers.roast_weight = answers.roast_weight || '3-4';
            }
            onUpdate(newAnswers, !!v);
          }}
        />
        {choice === 'steaks' && (
          <>
            <ThicknessSelector value={thickness} onChange={(v) => onUpdate({ ...answers, thickness: v }, !!choice)} />
            <SteaksPerPackSelector value={steaksPerPack} onChange={(v) => onUpdate({ ...answers, steaks_per_pack: v }, !!choice)} />
          </>
        )}
        {choice === 'roasts' && (
          <RoastWeightSelector value={(answers.roast_weight as string) || '3-4'} onChange={(v) => onUpdate({ ...answers, roast_weight: v }, !!choice)} />
        )}
        {choice && (
          <ConfirmationMessage text={cd.choices[choice as keyof typeof cd.choices] ?? ''} />
        )}
      </div>
    );
  }

  // ─── SECTION 7: ROUND ───
  if (section.id === 'round') {
    const choice = answers.choice as string | undefined;
    const thickness = (answers.thickness as string) || '3/4"';
    const steaksPerPack = (answers.steaks_per_pack as number) || 2;
    const cd = cutDescriptions.round;

    return (
      <div className="space-y-4">
        <p className="text-brand-gray text-sm leading-relaxed mb-4">{intro}</p>
        <OptionSelector
          options={[
            { id: 'roasts', label: 'Roasts' },
            { id: 'steaks', label: 'Steaks' },
            { id: 'grind', label: 'Ground Beef' },
          ]}
          value={choice ?? null}
          onChange={(v) => {
            const newAnswers: Record<string, unknown> = { choice: v };
            if (v === 'steaks') {
              newAnswers.thickness = thickness;
              newAnswers.steaks_per_pack = steaksPerPack;
            } else if (v === 'roasts') {
              newAnswers.roast_weight = answers.roast_weight || '3-4';
            }
            onUpdate(newAnswers, !!v);
          }}
        />
        {choice === 'steaks' && (
          <>
            <ThicknessSelector value={thickness} onChange={(v) => onUpdate({ ...answers, thickness: v }, !!choice)} />
            <SteaksPerPackSelector value={steaksPerPack} onChange={(v) => onUpdate({ ...answers, steaks_per_pack: v }, !!choice)} />
          </>
        )}
        {choice === 'roasts' && (
          <RoastWeightSelector value={(answers.roast_weight as string) || '3-4'} onChange={(v) => onUpdate({ ...answers, roast_weight: v }, !!choice)} />
        )}
        {choice && (
          <ConfirmationMessage text={cd.choices[choice as keyof typeof cd.choices] ?? ''} />
        )}
      </div>
    );
  }

  // ─── SECTION 8: SHORT_LOIN ───
  if (section.id === 'short_loin') {
    const choice = answers.choice as string | undefined;
    const thickness = (answers.thickness as string) || '1"';
    const filetThickness = (answers.filet_thickness as string) || '1.5"';
    const steaksPerPack = (answers.steaks_per_pack as number) || 2;
    const filetSteaksPerPack = (answers.filet_steaks_per_pack as number) || 2;
    const cd = cutDescriptions.short_loin;

    return (
      <div className="space-y-4">
        <p className="text-brand-gray text-sm leading-relaxed mb-4">{intro}</p>
        <OptionSelector
          options={[
            { id: 'tbone', label: 'T-Bone Steaks' },
            { id: 'ny_strip_and_filet', label: 'NY Strip & Filet Mignon' },
          ]}
          value={choice ?? null}
          onChange={(v) => {
            const newAnswers: Record<string, unknown> = { choice: v };
            if (v === 'tbone') {
              newAnswers.thickness = thickness;
              newAnswers.steaks_per_pack = steaksPerPack;
            } else if (v === 'ny_strip_and_filet') {
              newAnswers.thickness = thickness;
              newAnswers.filet_thickness = filetThickness;
              newAnswers.steaks_per_pack = steaksPerPack;
              newAnswers.filet_steaks_per_pack = filetSteaksPerPack;
            }
            onUpdate(newAnswers, !!v);
          }}
        />
        {choice === 'tbone' && (
          <>
            <ThicknessSelector value={thickness} onChange={(v) => onUpdate({ ...answers, thickness: v }, !!choice)} label="T-Bone Thickness" />
            <SteaksPerPackSelector value={steaksPerPack} onChange={(v) => onUpdate({ ...answers, steaks_per_pack: v }, !!choice)} />
          </>
        )}
        {choice === 'ny_strip_and_filet' && (
          <>
            <ThicknessSelector value={thickness} onChange={(v) => onUpdate({ ...answers, thickness: v }, !!choice)} label="NY Strip Thickness" />
            <ThicknessSelector value={filetThickness} onChange={(v) => onUpdate({ ...answers, filet_thickness: v }, !!choice)} label="Filet Thickness" />
            <SteaksPerPackSelector value={steaksPerPack} onChange={(v) => onUpdate({ ...answers, steaks_per_pack: v }, !!choice)} />
            <SteaksPerPackSelector value={filetSteaksPerPack} onChange={(v) => onUpdate({ ...answers, filet_steaks_per_pack: v }, !!choice)} />
          </>
        )}
        {choice && (
          <ConfirmationMessage text={cd.choices[choice as keyof typeof cd.choices] ?? ''} />
        )}
      </div>
    );
  }

  // ─── SECTION 9: FLANK ───
  if (section.id === 'flank') {
    const choice = (answers.choice as boolean | undefined) !== undefined ? (answers.choice as boolean) : null;
    const cd = cutDescriptions.flank;
    return (
      <div className="space-y-4">
        <p className="text-brand-gray text-sm leading-relaxed mb-4">{intro}</p>
        <YesNoSelector
          value={choice}
          onChange={(v) => onUpdate({ choice: v }, true)}
        />
        {choice !== null && (
          <ConfirmationMessage text={cd.choices[choice ? 'yes' : 'no']} />
        )}
      </div>
    );
  }

  // ─── SECTION 10: STEW_MEAT ───
  if (section.id === 'stew_meat') {
    const choice = (answers.choice as boolean | undefined) !== undefined ? (answers.choice as boolean) : null;
    const pounds = (answers.pounds as number) || 2;
    const cd = cutDescriptions.stew_meat;

    return (
      <div className="space-y-4">
        <p className="text-brand-gray text-sm leading-relaxed mb-4">{intro}</p>
        <YesNoSelector
          value={choice}
          onChange={(v) => {
            const newAnswers: Record<string, unknown> = { choice: v };
            if (v) newAnswers.pounds = pounds;
            onUpdate(newAnswers, true);
          }}
        />
        {choice === true && (
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-2">Pounds</label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 1.5, 2, 2.5, 3].map(n => (
                <button
                  key={n}
                  onClick={() => onUpdate({ ...answers, pounds: n }, true)}
                  className={`py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                    pounds === n
                      ? 'border-brand-orange bg-brand-orange-light text-brand-orange'
                      : 'border-brand-gray-light bg-white text-brand-dark hover:border-brand-orange/50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
        {choice !== null && (
          <ConfirmationMessage text={cd.choices[choice ? 'yes_with_pounds' : 'no']} />
        )}
      </div>
    );
  }

  // ─── SECTION 11: TENDERIZED_ROUND ───
  if (section.id === 'tenderized_round') {
    const roundChoice = answers.round_choice as string | undefined;
    if (roundChoice !== 'steaks') {
      return (
        <div className="bg-brand-warm rounded-xl p-4 text-center border-2 border-dashed border-brand-gray-light">
          <p className="text-brand-gray text-sm mb-2">This section only applies if you chose steaks for Round.</p>
          <p className="text-xs text-brand-gray">Since you chose {roundChoice || 'something other than steaks'}, we&apos;ll skip this one.</p>
        </div>
      );
    }
    const choice = (answers.choice as boolean | undefined) !== undefined ? (answers.choice as boolean) : null;
    const cd = cutDescriptions.tenderized_round;
    return (
      <div className="space-y-4">
        <p className="text-brand-gray text-sm leading-relaxed mb-4">{intro}</p>
        <YesNoSelector
          value={choice}
          onChange={(v) => onUpdate({ choice: v }, true)}
        />
        {choice !== null && (
          <ConfirmationMessage text={cd.choices[choice ? 'yes' : 'no']} />
        )}
      </div>
    );
  }

  // ─── SECTION 12: ORGANS ───
  if (section.id === 'organs') {
    const choice = (answers.choice as string[]) || [];
    const cd = cutDescriptions.organs;

    const handleOrgans = (id: string | string[]) => {
      const singleId = id as string;
      let newChoice = choice.includes(singleId) ? choice.filter(x => x !== singleId) : [...choice, singleId];
      if (singleId === 'none') {
        newChoice = choice.includes('none') ? [] : ['none'];
      } else {
        newChoice = newChoice.filter(x => x !== 'none');
      }
      onUpdate({ choice: newChoice }, newChoice.length > 0);
    };

    return (
      <div className="space-y-4">
        <p className="text-brand-gray text-sm leading-relaxed mb-4">{intro}</p>
        <OptionSelector
          options={[
            { id: 'tongue', label: 'Tongue' },
            { id: 'heart', label: 'Heart' },
            { id: 'liver', label: 'Liver' },
            { id: 'none', label: 'No organs' },
          ]}
          value={choice}
          onChange={handleOrgans}
          multi={true}
        />
        {choice.length > 0 && !choice.includes('none') && (
          <div className="space-y-2">
            {choice.map(organ => (
              <ConfirmationMessage key={organ} text={cd.choices[organ as keyof typeof cd.choices] ?? ''} />
            ))}
          </div>
        )}
        {choice.includes('none') && <ConfirmationMessage text={cd.choices.none} />}
        <p className="text-xs text-brand-gray border-t border-brand-gray-light pt-3">Organs must be requested at drop-off. If your cut sheet doesn&apos;t reach us before butcher day, organs won&apos;t be available.</p>
      </div>
    );
  }

  // ─── SECTION 13: BONES ───
  if (section.id === 'bones') {
    const choice = answers.choice as string | undefined;
    const cd = cutDescriptions.bones;
    return (
      <div className="space-y-4">
        <p className="text-brand-gray text-sm leading-relaxed mb-4">{intro}</p>
        <OptionSelector
          options={[
            { id: 'dog', label: 'Dog Bones' },
            { id: 'soup', label: 'Soup Bones' },
            { id: 'none', label: 'Skip the bones' },
          ]}
          value={choice ?? null}
          onChange={(v) => onUpdate({ choice: v }, !!v)}
        />
        {choice && (
          <ConfirmationMessage text={cd.choices[choice as keyof typeof cd.choices] ?? ''} />
        )}
      </div>
    );
  }

  // ─── SECTION 14: PACKING ───
  if (section.id === 'packing') {
    const fatPct = (answers.fat_pct as string) || '';
    const lbsPerPack = (answers.lbs_per_pack as number) || 0;
    const packages = (answers.packages as number) || 0;
    const isComplete = !!(fatPct && lbsPerPack && packages > 0);

    return (
      <div className="space-y-4">
        <p className="text-brand-gray text-sm leading-relaxed mb-4">{intro}</p>

        <div>
          <label className="block text-sm font-semibold text-brand-dark mb-2">Fat Percentage</label>
          <div className="grid grid-cols-3 gap-2">
            {['80/20', '85/15', '90/10'].map(pct => (
              <button
                key={pct}
                onClick={() => {
                  const updated = { ...answers, fat_pct: pct };
                  onUpdate(updated, !!(pct && lbsPerPack && packages > 0));
                }}
                className={`py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                  fatPct === pct
                    ? 'border-brand-orange bg-brand-orange-light text-brand-orange'
                    : 'border-brand-gray-light bg-white text-brand-dark hover:border-brand-orange/50'
                }`}
              >
                {pct}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-dark mb-2">Pounds per Package</label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 1.5, 2].map(lbs => (
              <button
                key={lbs}
                onClick={() => {
                  const updated = { ...answers, lbs_per_pack: lbs };
                  onUpdate(updated, !!(fatPct && lbs && packages > 0));
                }}
                className={`py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                  lbsPerPack === lbs
                    ? 'border-brand-orange bg-brand-orange-light text-brand-orange'
                    : 'border-brand-gray-light bg-white text-brand-dark hover:border-brand-orange/50'
                }`}
              >
                {lbs} lb
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-dark mb-2">Packages per Order</label>
          <input
            type="number"
            min="1"
            max="20"
            value={packages || ''}
            onChange={(e) => {
              const pkgs = parseInt(e.target.value, 10) || 0;
              const updated = { ...answers, packages: pkgs };
              onUpdate(updated, !!(fatPct && lbsPerPack && pkgs > 0));
            }}
            className="w-full px-4 py-2 border border-brand-gray-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
          />
        </div>

        {isComplete && (
          <ConfirmationMessage text={`Your burger will be packed as ${lbsPerPack} lb packages, ${packages} packages total, ${fatPct} fat.`} />
        )}
      </div>
    );
  }

  return null;
}

// ─── Spotify Wrapped Screen ───────────────────────────────────────────────────

function SpotifyWrappedScreen({ session, answers }: { session: Session; answers: CutSheetAnswer[] }) {
  const totalCuts = answers.filter(a => a.completed && !a.answers.house_default).length;
  const houseDefaults = answers.filter(a => a.answers.house_default).length;
  const butcherDate = session.animal?.butcher_date
    ? new Date(session.animal.butcher_date + 'T00:00:00')
    : null;
  const daysUntil = butcherDate
    ? Math.ceil((butcherDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full text-center space-y-8">
        {/* Hero */}
        <div>
          <div className="text-6xl mb-4">🥩</div>
          <h1 className="font-display font-bold text-4xl mb-2">Your Cut Sheet is Locked!</h1>
          <p className="text-white/70 text-base">Your order is headed to the butcher exactly how you want it.</p>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="bg-white/10 rounded-2xl p-6">
            <p className="text-5xl font-bold text-brand-orange">{totalCuts}</p>
            <p className="text-white/70 text-sm mt-1">Sections you customized</p>
          </div>
          {houseDefaults > 0 && (
            <div className="bg-white/10 rounded-2xl p-6">
              <p className="text-5xl font-bold text-brand-orange">{houseDefaults}</p>
              <p className="text-white/70 text-sm mt-1">Sections using house defaults</p>
            </div>
          )}
          {daysUntil !== null && (
            <div className="bg-white/10 rounded-2xl p-6">
              <p className="text-5xl font-bold text-brand-orange">{daysUntil}</p>
              <p className="text-white/70 text-sm mt-1">Days until butcher day</p>
            </div>
          )}
          <div className="bg-white/10 rounded-2xl p-6">
            <p className="text-lg font-bold text-brand-orange">~{
              session.purchase_type === 'whole' ? '390–465' :
              session.purchase_type === 'half' ? '195–235' : '98–118'
            } lbs</p>
            <p className="text-white/70 text-sm mt-1">Approximate finished cuts you&apos;ll receive</p>
            <p className="text-white/40 text-xs mt-1">Based on typical hanging weight yields</p>
          </div>
        </div>

        {/* What's next */}
        <div className="bg-brand-green rounded-2xl p-6 text-left">
          <p className="font-semibold text-white mb-2">What happens next?</p>
          <p className="text-white/80 text-sm leading-relaxed">We&apos;ll send your cut sheet to T-K Processing before butcher day. You&apos;ll get an email when your beef is ready for pickup with your final balance and pickup scheduling.</p>
        </div>

        {/* Share */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'I just reserved my beef!',
                text: `I reserved ${session.purchase_type} beef from Legacy Land & Cattle — grass-fed, custom cut, straight from the ranch. 🐄`,
                url: window.location.origin,
              });
            }
          }}
          className="w-full py-4 rounded-xl bg-brand-orange font-semibold text-white text-base"
        >
          Share with Friends 🐄
        </button>

        <p className="text-white/40 text-xs">You&apos;ll receive a copy of your cut sheet by email shortly.</p>
      </div>
    </div>
  );
}

// ─── Section Form ─────────────────────────────────────────────────────────────

function SectionForm({
  section,
  answers,
  locked,
  sessionId,
  allAnswers,
  onSave,
  onNext,
  onPrev,
  isFirst,
  isLast,
  completedAll,
}: {
  section: typeof SECTIONS[0];
  answers: Record<string, unknown>;
  locked: boolean;
  sessionId: string;
  allAnswers: CutSheetAnswer[];
  onSave: (answers: Record<string, unknown>, completed: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  completedAll: boolean;
}) {
  const [customRequest, setCustomRequest] = useState('');
  const [customSaved, setCustomSaved] = useState(false);

  const handleUseHouseDefault = () => {
    onSave({ ...HOUSE_DEFAULTS[section.id], house_default: true }, true);
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

  // Pass round choice to tenderized_round
  const enrichedAnswers = section.id === 'tenderized_round'
    ? {
        ...answers,
        round_choice: allAnswers.find(a => a.section === 'round')?.answers?.choice as string | undefined,
      }
    : answers;

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
            {getSectionContent(
              section,
              enrichedAnswers,
              (newAnswers, completed) => onSave(newAnswers, completed),
            )}

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
          {isLast && completedAll ? 'Lock In My Cut Sheet 🔒' : isLast ? 'Review & Finish →' : 'Next →'}
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
  const [showWrapped, setShowWrapped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const completedSections = answers.filter(a => a.completed).map(a => a.section);
  const completedAll = SECTIONS.every(s => completedSections.includes(s.id));

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

  const handleNext = async () => {
    if (currentIndex < SECTIONS.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      // All sections complete — lock the cut sheet
      const res = await fetch(`/api/cut-sheet/${uuid}/lock`, { method: 'POST' });
      if (res.ok) {
        setShowWrapped(true);
      }
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

  if (showWrapped) {
    return <SpotifyWrappedScreen session={session} answers={answers} />;
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
            allAnswers={answers}
            onSave={(sectionAnswers, completed) => saveSection(currentSection.id, sectionAnswers, completed)}
            onNext={handleNext}
            onPrev={handlePrev}
            isFirst={currentIndex === 0}
            isLast={currentIndex === SECTIONS.length - 1}
            completedAll={completedAll}
          />
        </>
      )}
    </div>
  );
}
