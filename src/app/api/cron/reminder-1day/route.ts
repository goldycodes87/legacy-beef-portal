export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createAccessToken } from '@/lib/access-token';
import { emailBase, ctaButton } from '@/lib/email-templates';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';

export async function POST(request: NextRequest) {
  // Verify Vercel authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const today = new Date();
  const eightDaysFromNow = new Date(today);
  eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);
  eightDaysFromNow.setHours(0, 0, 0, 0);

  // Find sessions with butcher_date exactly 8 days away (1 day before auto-lock)
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
    return butcherDate.toDateString() === eightDaysFromNow.toDateString();
  });

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  for (const session of sessionsToRemind) {
    const animal = Array.isArray(session.animals) ? session.animals[0] : session.animals;
    const customer = Array.isArray(session.customers) ? session.customers[0] : session.customers;
    if (!animal || !customer) continue;

    const token = await createAccessToken(session.id, new Date(animal.butcher_date));
    const firstName = customer.name?.split(' ')[0] ?? 'there';
    const incompleteCount = (session.cut_sheet_answers || []).filter(a => !a.completed).length;
    const incompleteList = incompleteCount > 0
      ? `<p style="color:#6B7280;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;margin:0 0 20px;"><strong style="color:#0F0F0F;">Incomplete sections:</strong> ${incompleteCount} section(s) waiting for your attention.</p>`
      : '';

    const preheader = 'Tomorrow we lock your cut sheet automatically.';
    const content = `
      <h2 style="font-family:Georgia,serif;color:#0F0F0F;font-size:22px;margin:0 0 8px;">
        ${firstName}, this is your last reminder.
      </h2>
      <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">
        Tomorrow your cut sheet will be locked automatically. Any sections
        you haven't filled out will use our House Cut Sheet defaults — which
        is a solid selection, but your preferences are always better.
      </p>

      ${incompleteList}

      ${ctaButton('Complete My Cut Sheet Now →', `${APP_URL}/token/${token}`)}

      <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:14px;">
        Don't want to fill it out? No worries — our house defaults will
        take good care of your beef.
      </p>
    `;

    const htmlEmail = emailBase(content, preheader);

    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: customer.email,
      subject: 'Last call — your cut sheet locks tomorrow 🔒',
      html: htmlEmail,
    }).catch(err => console.error('Resend error:', err));
  }

  return NextResponse.json({ reminded: sessionsToRemind.length });
}
