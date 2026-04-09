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
      id, invite_expires_at, is_splitting, group_role, group_id,
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

  const extendLink = `${APP_URL}/api/book/extend-invite?session_id=${session_id}`;
  const soloLink = `${APP_URL}/api/book/convert-solo?session_id=${session_id}`;
  const cancelLink = `${APP_URL}/api/book/cancel?session_id=${session_id}`;

  const preheader = '48-hour window has passed — here are your options.';
  const content = `
    <h2 style="font-family:Georgia,serif;color:#0F0F0F;font-size:22px;margin:0 0 8px;">
      Heads up, ${ownerFirstName}.
    </h2>
    <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">
      Your partner hasn't paid their deposit yet. Their 48-hour window
      has passed. Here are your options:
    </p>

    ${ctaButton('Give them 24 more hours', extendLink, '#1A3D2B')}
    ${ctaButton('Keep my half at $8.25/lb', soloLink, '#6B7280')}
    ${ctaButton('Cancel my reservation', cancelLink, '#dc2626')}

    <p style="font-size:12px;color:#aaa;font-family:Arial,sans-serif;">
      If you take no action, we'll follow up in 24 hours.
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
