export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { build, autoLocked } from '@/lib/email-content';

const HOUSE_DEFAULTS = {
  chuck: { choice: 'steaks', thickness: '1"', steaks_per_pack: 2 },
  brisket: { choice: 'half' },
  skirt: { choice: true },
  rib: { choice: 'bone_in_steaks', thickness: '1"', steaks_per_pack: 2 },
  short_ribs: { choice: true },
  sirloin: { choice: 'steaks', thickness: '1"', steaks_per_pack: 2 },
  round: { choice: 'grind' },
  short_loin: { choice: 'tbone', tbone_thickness: '1"', steaks_per_pack: 2 },
  flank: { choice: true },
  stew_meat: { choice: false },
  tenderized_round: { choice: 'skipped' },
  organs: { choices: ['none'] },
  bones: { choices: ['soup'] },
  packing: { fat_pct: '85/15', lbs_per_pack: 1 },
};

export async function POST(request: NextRequest) {
  // Verify Vercel authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const today = new Date();
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  sevenDaysFromNow.setHours(0, 0, 0, 0);

  // Find sessions with butcher_date exactly 7 days away
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, status, cut_sheet_complete,
      animals(id, name, butcher_date),
      customers(name, email),
      cut_sheet_answers(id, session_id, section, completed)
    `)
    .eq('status', 'deposit_paid')
    .eq('cut_sheet_complete', false)
    .order('animals.butcher_date', { ascending: true });

  const sessionsToLock = (sessions || []).filter(s => {
    const animal = Array.isArray(s.animals) ? s.animals[0] : s.animals;
    if (!animal) return false;
    const butcherDate = new Date(animal.butcher_date);
    return butcherDate.toDateString() === sevenDaysFromNow.toDateString();
  });

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';

  for (const session of sessionsToLock) {
    const customer = Array.isArray(session.customers) ? session.customers[0] : session.customers;
    const animal = Array.isArray(session.animals) ? session.animals[0] : session.animals;
    if (!customer || !animal) continue;

    const existingAnswers = session.cut_sheet_answers || [];
    const completedSections = new Set(existingAnswers.filter(a => a.completed).map(a => a.section));

    // Fill in missing/incomplete sections with house defaults
    for (const [section, defaults] of Object.entries(HOUSE_DEFAULTS)) {
      if (!completedSections.has(section)) {
        // The unique constraint covers (session_id, section, half); naming only
        // two of the three columns meant this upsert always errored.
        const { error: upsertError } = await supabase
          .from('cut_sheet_answers')
          .upsert(
            {
              session_id: session.id,
              section,
              half: null,
              answers: { ...defaults, house_default: true },
              completed: true,
              locked: true,
            },
            { onConflict: 'session_id,section,half' }
          );

        if (upsertError) {
          console.error(`Auto-lock could not fill section ${section} for ${session.id}:`, upsertError);
        }
      }
    }

    // Lock all sections
    await supabase
      .from('cut_sheet_answers')
      .update({ locked: true })
      .eq('session_id', session.id);

    // Update session
    await supabase
      .from('sessions')
      .update({
        status: 'locked',
        cut_sheet_complete: true,
        cut_sheet_locked_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    // Fetch all answers for summary
    const { data: allAnswers } = await supabase
      .from('cut_sheet_answers')
      .select('section, answers')
      .eq('session_id', session.id);

    const firstName = customer.name?.split(' ')[0] ?? 'there';
    const butcherDateStr = new Date(animal.butcher_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const preheader = `No worries, ${firstName} — your beef is in good hands.`;
    const { subject, html } = build(autoLocked, {
      firstName,
      butcherDate: butcherDateStr,
      answers: (allAnswers || []) as any,
    });


    // Send confirmation email
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: customer.email,
      subject,
      html,
    }).catch(err => console.error('Resend error:', err));
  }

  return NextResponse.json({ locked: sessionsToLock.length });
}
/**
 * Vercel Cron invokes the path with GET. This route only exported POST, so the
 * daily run answered 405 and this job has never actually fired in production.
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
