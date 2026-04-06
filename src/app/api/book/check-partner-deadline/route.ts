export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

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

  // Send deadline passed email to owner with options
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
    to: customers.email,
    subject: 'Your partner spot has expired',
    html: `
<p>Hi ${customers.name?.split(' ')[0]},</p>
<p>Your partner hasn't confirmed their spot yet. Your deadline has passed.</p>
<p>You have three options:</p>
<ol>
  <li><a href="${APP_URL}/api/book/extend-invite?session_id=${session_id}">Give them 24 more hours</a></li>
  <li><a href="${APP_URL}/api/book/convert-solo?session_id=${session_id}">Keep my Half at $8.25/lb (convert to solo)</a></li>
  <li><a href="${APP_URL}/api/book/cancel?session_id=${session_id}">Cancel my reservation</a></li>
</ol>
<p>Contact us if you have questions.</p>
    `,
  });

  return NextResponse.json({ ok: true });
}
