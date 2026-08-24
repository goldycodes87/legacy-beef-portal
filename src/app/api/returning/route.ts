export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { emailBase, ctaButton } from '@/lib/email-templates';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';

/**
 * Emails a returning customer a link back into their most recent order.
 *
 * Always answers the same way whether or not the address is on file — telling
 * a stranger which emails belong to customers is exactly the leak we closed on
 * the old lookup endpoint. The link itself is the existing access token, so
 * this adds no new way in.
 */
export async function POST(request: NextRequest) {
  const SAME_ANSWER = NextResponse.json({
    ok: true,
    message: 'If we have an order for that email, a sign-in link is on its way.',
  });

  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: customer } = await supabase
      .from('customers')
      .select('id, name')
      .eq('email', email.toLowerCase().trim())
      .is('archived_at', null)
      .maybeSingle();

    if (!customer) return SAME_ANSWER;

    const { data: session } = await supabase
      .from('sessions')
      .select('id, access_token, animals (name, butcher_date)')
      .eq('customer_id', customer.id)
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) return SAME_ANSWER;

    // Mint a token if this order never got one (cash customers used not to).
    let token = (session as any).access_token;
    if (!token) {
      const { createAccessToken } = await import('@/lib/access-token');
      token = await createAccessToken(session.id, new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
    }

    const animal = Array.isArray((session as any).animals)
      ? (session as any).animals[0]
      : (session as any).animals;
    const firstName = customer.name?.split(' ')[0] ?? 'there';

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && resendKey !== 're_placeholder_set_in_vercel') {
      const { Resend } = await import('resend');
      const resend = new Resend(resendKey);

      const content = `
        <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 20px;">
          Hi ${firstName} — here's your way back in. This link opens your order, where you can
          see your cut sheet, your balance and your pickup details.
        </p>
        ${ctaButton('Open my order →', `${APP_URL}/api/token/${token}`)}
        ${animal?.name ? `<p style="color:#6B7280;font-family:Arial,sans-serif;font-size:13px;text-align:center;margin-top:8px;">Most recent order: ${animal.name}</p>` : ''}
        <p style="color:#9CA3AF;font-size:12px;font-family:Arial,sans-serif;text-align:center;margin-top:20px;">
          If you didn't ask for this, you can ignore it. Questions? Call (719) 258-1777.
        </p>
      `;

      await resend.emails.send({
        from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
        to: email.toLowerCase().trim(),
        subject: 'Your Legacy Land & Cattle order',
        html: emailBase(content, 'Here is your way back into your order.'),
      });
    }

    return SAME_ANSWER;
  } catch (err) {
    console.error('Returning customer link error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again, or call (719) 258-1777.' },
      { status: 500 }
    );
  }
}
