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

    const token = await createAccessToken(session.id, new Date(animal.butcher_date));
    const firstName = customer.name?.split(' ')[0] ?? 'there';
    const incompleteCount = (session.cut_sheet_answers || []).filter(a => !a.completed).length;
    const incompleteList = incompleteCount > 0
      ? `<p style="color:#6B7280;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;margin:0 0 20px;"><strong style="color:#0F0F0F;">Incomplete sections:</strong> ${incompleteCount} section(s) still need attention.</p>`
      : '';

    const preheader = 'A quick reminder to fill out your beef cutting instructions.';
    const content = `
      <h2 style="font-family:Georgia,serif;color:#0F0F0F;font-size:22px;margin:0 0 8px;">
        Hey ${firstName} — butcher day is coming up!
      </h2>
      <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">
        Your beef is scheduled for ${new Date(animal.butcher_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. You have 10 days to fill out your cut sheet and tell us how you want everything cut.
      </p>

      ${incompleteList}

      ${ctaButton('Fill Out My Cut Sheet →', `${APP_URL}/token/${token}`, '#1A3D2B')}

      <p style="font-size:12px;color:#aaa;text-align:center;font-family:Arial,sans-serif;">
        This link takes you directly to your order — no login required.
      </p>
    `;

    const htmlEmail = emailBase(content, preheader);

    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: customer.email,
      subject: 'Your cut sheet is due in 10 days 🥩',
      html: htmlEmail,
    }).catch(err => console.error('Resend error:', err));
  }

  return NextResponse.json({ reminded: sessionsToRemind.length });
}
