export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { emailBase, ctaButton } from '@/lib/email-templates';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { session_id } = await request.json();

  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      id, invite_expires_at, is_splitting, group_role, group_id, purchase_type, partner_emails, partner_names,
      customers (id, name, email)
    `)
    .eq('id', session_id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Only apply to split owners
  if (!session.is_splitting || session.group_role !== 'owner') {
    return NextResponse.json({ ok: true });
  }

  // Check if deadline passed
  if (new Date(session.invite_expires_at) > new Date()) {
    return NextResponse.json({ ok: true }); // Not expired yet
  }

  // Check if partner has claimed
  const { data: partnerSession } = await supabase
    .from('sessions')
    .select('id')
    .eq('group_id', session.group_id)
    .eq('group_role', 'partner')
    .neq('status', 'cancelled');

  if (partnerSession && partnerSession.length > 0) {
    return NextResponse.json({ ok: true }); // Partner already claimed
  }

  const customers = session.customers as unknown as { id: string; name: string; email: string };
  const ownerFirstName = customers.name?.split(' ')[0] ?? 'there';

  const partnerName =
    ((session.partner_names as string[]) || [])[0] ||
    ((session.partner_emails as string[]) || [])[0] ||
    'your partner';
  const partnerFirstName = partnerName.split(' ')[0];
  const purchaseLabel =
    (session as any).purchase_type === 'whole' ? 'Whole Beef' : 'Half Beef';
  const downsizeLabel =
    (session as any).purchase_type === 'whole' ? 'Half Beef' : 'Quarter Beef';
  const downsizeLink = `${APP_URL}/api/book/downsize?session_id=${session_id}`;
  const inviteNewLink = `${APP_URL}/session/${session_id}/status?action=invite-new`;
  const deadlineTime = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const extendLink = `${APP_URL}/api/book/extend-invite?session_id=${session_id}`;
  const soloLink = `${APP_URL}/api/book/convert-solo?session_id=${session_id}`;

  const preheader = `${partnerFirstName} hasn't claimed their spot yet.`;
  const content = `
<div style="background:linear-gradient(135deg,#92400e 0%,#b45309 100%);border-radius:12px;padding:28px 24px;text-align:center;margin:0 0 28px;">
  <div style="font-size:40px;margin-bottom:8px;">⏰</div>
  <h2 style="font-family:Georgia,serif;color:white;font-size:24px;margin:0 0 8px;font-weight:normal;">
    Heads up, ${ownerFirstName}.
  </h2>
  <p style="color:#fde68a;font-size:14px;margin:0;font-family:Arial,sans-serif;">
    ${partnerFirstName} hasn't reserved their spot yet.
  </p>
</div>
<p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 20px;">
  You reserved a <strong>${purchaseLabel}</strong> and invited ${partnerFirstName} to split it with you. They haven't paid their deposit yet — you may want to give them a quick call or text to let them know their spot won't last forever.
</p>
<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:16px 20px;margin:0 0 24px;text-align:center;">
  <p style="font-family:Arial,sans-serif;font-size:13px;color:#92400e;margin:0;">
    ⚠️ Their spot expires on <strong>${deadlineTime}</strong>
  </p>
</div>
<p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 24px;">
  Here's what you can do:
</p>
<table role="presentation" style="width:100%;margin:0 0 12px;">
  <tr><td style="padding:0 0 12px;">
    <a href="${extendLink}" style="display:block;background:#1A3D2B;color:white;text-align:center;padding:14px 24px;border-radius:10px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;">
      ⏱ Give ${partnerFirstName} 24 more hours
    </a>
  </td></tr>
  <tr><td style="padding:0 0 12px;">
    <a href="${soloLink}" style="display:block;background:#4B5563;color:white;text-align:center;padding:14px 24px;border-radius:10px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;">
      🥩 Keep my ${purchaseLabel} (solo pricing)
    </a>
  </td></tr>
  <tr><td style="padding:0 0 12px;">
    <a href="${downsizeLink}" style="display:block;background:#6B7280;color:white;text-align:center;padding:14px 24px;border-radius:10px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;">
      📦 Downsize to a ${downsizeLabel}
    </a>
  </td></tr>
  <tr><td>
    <a href="${inviteNewLink}" style="display:block;background:#F5F0E8;color:#1A3D2B;text-align:center;padding:14px 24px;border-radius:10px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;border:2px solid #1A3D2B;">
      👤 Invite a different partner
    </a>
  </td></tr>
</table>
<p style="color:#9CA3AF;font-size:12px;font-family:Arial,sans-serif;text-align:center;margin-top:16px;">
  Questions? Call us at (719) 258-1777 or reply to this email.
</p>
  `;

  const htmlEmail = emailBase(content, preheader);

  // Send deadline passed email to owner with options
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
    to: customers.email,
    subject: 'Your partner hasn\'t claimed their spot yet',
    html: htmlEmail,
  });

  return NextResponse.json({ ok: true });
}
