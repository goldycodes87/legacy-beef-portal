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

    const preheader = `${firstName} — last chance. Cut sheet locks tomorrow.`;
    const content = `
      <div style="background:linear-gradient(135deg,#92400e 0%,#b45309 100%);border-radius:12px;padding:28px 24px;text-align:center;margin:0 0 28px;">
        <div style="font-size:40px;margin-bottom:8px;">⏰</div>
        <h2 style="font-family:Georgia,serif;color:white;font-size:24px;margin:0 0 8px;font-weight:normal;">
          Last call, ${firstName}.
        </h2>
        <p style="color:#fde68a;font-size:14px;margin:0;font-family:Arial,sans-serif;">
          Your cut sheet locks tomorrow.
        </p>
      </div>
      <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Tomorrow we hand your cut sheet to T-K Processing — whatever's in there is what gets cut. If yours isn't done, we'll fill it with our <strong>Legacy House Cut</strong>, which is a solid, well-rounded selection. But your custom preferences will always be better.
      </p>
      <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 24px;">
        It takes 10 minutes. You've got until end of day.
      </p>
      ${incompleteList}
      <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
        <p style="font-family:Arial,sans-serif;font-size:13px;color:#92400e;margin:0;line-height:1.6;">
          ⚠️ After tomorrow, your cut sheet will be locked and cannot be changed.
        </p>
      </div>
      ${ctaButton('Complete My Cut Sheet Now →', `${APP_URL}/token/${token}`)}
      <p style="font-size:13px;color:#6B7280;text-align:center;font-family:Arial,sans-serif;margin-top:12px;">
        Happy with the house defaults? No action needed — we've got you covered.
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
