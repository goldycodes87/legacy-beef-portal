export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createAccessToken } from '@/lib/access-token';
import { build, reminder10Day, outstandingSections } from '@/lib/email-content';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';

export async function POST(request: NextRequest) {
  // Verify Vercel authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const today = new Date();
  const tenDaysFromNow = new Date(today);
  tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
  tenDaysFromNow.setHours(0, 0, 0, 0);

  // Find sessions with butcher_date exactly 10 days away
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, customer_id, status, cut_sheet_complete,
      animals(id, name, butcher_date),
      customers(name, email),
      cut_sheet_answers(id, section, completed)
    `)
    .eq('status', 'deposit_paid')
    .eq('cut_sheet_complete', false)
    .order('animals.butcher_date', { ascending: true });

  const sessionsToRemind = (sessions || []).filter(s => {
    const animal = Array.isArray(s.animals) ? s.animals[0] : s.animals;
    if (!animal) return false;
    const butcherDate = new Date(animal.butcher_date);
    return butcherDate.toDateString() === tenDaysFromNow.toDateString();
  });

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  for (const session of sessionsToRemind) {
    const animal = Array.isArray(session.animals) ? session.animals[0] : session.animals;
    const customer = Array.isArray(session.customers) ? session.customers[0] : session.customers;
    if (!animal || !customer) continue;

    const tokenExpiry = new Date(animal.butcher_date);
      tokenExpiry.setDate(tokenExpiry.getDate() + 60);
      const token = await createAccessToken(session.id, tokenExpiry);
    const firstName = customer.name?.split(' ')[0] ?? 'there';
    // Names the sections, and counts ones never started. The old count only
    // looked at rows that existed, so an untouched sheet reported nothing due.
    const incompleteSections = outstandingSections(session.cut_sheet_answers);

    const butcherDateFormatted = new Date(animal.butcher_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const { subject, html } = build(reminder10Day, {
      firstName,
      butcherDate: butcherDateFormatted,
      cutSheetUrl: `${APP_URL}/api/token/${token}`,
      incompleteSections,
    });


    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: customer.email,
      subject,
      html,
    }).catch(err => console.error('Resend error:', err));
  }

  return NextResponse.json({ reminded: sessionsToRemind.length });
}
/**
 * Vercel Cron invokes the path with GET. This route only exported POST, so the
 * daily run answered 405 and this job has never actually fired in production.
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
