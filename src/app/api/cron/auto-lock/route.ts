export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

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

    // Send confirmation email
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const summaryHtml = Object.entries(HOUSE_DEFAULTS)
      .map(([section, defaults]) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${section}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${JSON.stringify(defaults)}</td>
        </tr>
      `)
      .join('');

    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: customer.email,
      subject: 'Your cut sheet has been locked 🔒',
      html: `
        <p>Hi ${customer.name?.split(' ')[0]},</p>
        <p><strong>Your cut sheet is now locked.</strong> Here's the full summary:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 8px; text-align: left;">Section</th>
              <th style="padding: 8px; text-align: left;">Your Choice</th>
            </tr>
          </thead>
          <tbody>
            ${summaryHtml}
          </tbody>
        </table>
        <p style="margin-top: 20px;">
          <a href="${APP_URL}/session/${session.id}/review" style="background-color: #2D5016; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View Full Cut Sheet →
          </a>
        </p>
      `,
    }).catch(err => console.error('Resend error:', err));
  }

  return NextResponse.json({ locked: sessionsToLock.length });
}
