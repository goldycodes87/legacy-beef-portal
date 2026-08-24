export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { build, partnerDeadline } from '@/lib/email-content';

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

  const { subject, html } = build(partnerDeadline, {
    ownerFirstName,
    partnerFirstName,
    purchaseLabel,
    deadline: deadlineTime,
    extendUrl: extendLink,
    soloUrl: soloLink,
    newPartnerUrl: inviteNewLink,
  });


  // Send deadline passed email to owner with options
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
    to: customers.email,
    subject,
    html,
  });

  return NextResponse.json({ ok: true });
}
