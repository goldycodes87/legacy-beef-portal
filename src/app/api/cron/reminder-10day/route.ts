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

    const tokenExpiry = new Date(animal.butcher_date);
      tokenExpiry.setDate(tokenExpiry.getDate() + 60);
      const token = await createAccessToken(session.id, tokenExpiry);
    const firstName = customer.name?.split(' ')[0] ?? 'there';
    const incompleteCount = (session.cut_sheet_answers || []).filter(a => !a.completed).length;
    const incompleteList = incompleteCount > 0
      ? `<p style="color:#6B7280;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;margin:0 0 20px;"><strong style="color:#0F0F0F;">Incomplete sections:</strong> ${incompleteCount} section(s) still need attention.</p>`
      : '';

    const preheader = `${firstName}, your cut sheet is due in 10 days.`;
    const butcherDateFormatted = new Date(animal.butcher_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const content = `
      <table role="presentation" width="100%" style="border-radius:12px;margin:0 0 28px;"><tr><td bgcolor="#1A3D2B" style="background:linear-gradient(135deg,#1A3D2B 0%,#2d6a4f 100%);border-radius:12px;padding:28px 24px;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">✂️</div>
        <h2 style="font-family:Georgia,serif;color:white;font-size:24px;margin:0 0 8px;font-weight:normal;">
          Time to build your cut sheet, ${firstName}.
        </h2>
        <p style="color:#C4A46B;font-size:14px;margin:0;font-family:Arial,sans-serif;">
          Butcher date: ${butcherDateFormatted}
        </p>
      </td></tr></table>
      <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 16px;">
        We know life gets busy — but this is the fun part. Your cut sheet is where you tell our butcher <strong>exactly</strong> how you want your beef cut. Steak thickness, roast sizes, how much ground beef, whether you want bones or organs — all of it is up to you.
      </p>
      <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 24px;">
        You've got <strong>10 days</strong> to get it done before we hand it off to T-K Processing. It takes about 10 minutes.
      </p>
      ${incompleteList}
      <div style="background:#F0F7E8;border:1px solid #c3dfa0;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
        <p style="font-family:Arial,sans-serif;font-size:14px;color:#1A3D2B;margin:0 0 6px;font-weight:bold;">
          🏠 Not sure what to pick?
        </p>
        <p style="font-family:Arial,sans-serif;font-size:13px;color:#374151;margin:0;line-height:1.6;">
          No problem — our Legacy House Cut is a well-rounded selection that works great for most families. You can choose it with one click inside the cut sheet wizard.
        </p>
      </div>
      ${ctaButton('Build My Cut Sheet →', `${APP_URL}/api/token/${token}`, '#1A3D2B')}
      <p style="font-size:12px;color:#9CA3AF;text-align:center;font-family:Arial,sans-serif;margin-top:8px;">
        This link goes straight to your order — no login needed.
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
