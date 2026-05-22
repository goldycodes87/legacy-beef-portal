export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { emailBase, cutSheetSummary } from '@/lib/email-templates';

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
        // Upsert to fill in the gap
        await supabase
          .from('cut_sheet_answers')
          .upsert(
            {
              session_id: session.id,
              section,
              answers: { ...defaults, house_default: true },
              completed: true,
              locked: true,
            },
            { onConflict: 'session_id,section' }
          );
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
    const content = `
      <table role="presentation" width="100%" style="border-radius:12px;margin:0 0 28px;"><tr><td bgcolor="#1A3D2B" style="background:linear-gradient(135deg,#1A3D2B 0%,#2d6a4f 100%);border-radius:12px;padding:28px 24px;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">🏠</div>
        <h2 style="font-family:Georgia,serif;color:white;font-size:24px;margin:0 0 8px;font-weight:normal;">
          We've got you covered, ${firstName}.
        </h2>
        <p style="color:#C4A46B;font-size:14px;margin:0;font-family:Arial,sans-serif;">
          Your cut sheet is locked and on its way to the butcher.
        </p>
      </td></tr></table>
      <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Life gets busy — we get it. Since your cut sheet deadline passed, we've locked it in using our <strong>Legacy House Cut</strong>. It's a well-rounded selection our team put together that works great for most families.
      </p>
      <div style="background:#F0F7E8;border:1px solid #c3dfa0;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
        <p style="font-family:Arial,sans-serif;font-size:14px;color:#1A3D2B;margin:0 0 6px;font-weight:bold;">
          🥩 What's in the Legacy House Cut?
        </p>
        <p style="font-family:Arial,sans-serif;font-size:13px;color:#374151;margin:0;line-height:1.6;">
          A great mix of steaks, roasts, and ground beef — cut at standard thickness and packaged for easy freezer storage. You're going to love it.
        </p>
      </div>
      ${cutSheetSummary(allAnswers || [])}
      <p style="color:#374151;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;margin:16px 0 0;">
        Have a specific request before ${butcherDateStr}? Reply to this email and we'll do our best to make it happen.
      </p>
    `;
    const htmlEmail = emailBase(content, preheader);

    // Send confirmation email
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: customer.email,
      subject: 'Your cut sheet has been locked 🔒',
      html: htmlEmail,
    }).catch(err => console.error('Resend error:', err));
  }

  return NextResponse.json({ locked: sessionsToLock.length });
}
