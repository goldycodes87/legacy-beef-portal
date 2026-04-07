export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const sessionId = new URL(request.url).searchParams.get('session_id');
  const redirectStatus = new URL(request.url).searchParams.get('redirect_status');

  if (redirectStatus === 'succeeded') {
    // Update session
    await supabase
      .from('sessions')
      .update({
        balance_paid: true,
        balance_paid_at: new Date().toISOString(),
        balance_payment_method: 'card',
      })
      .eq('id', sessionId);

    // Send confirmation email
    const { data: session } = await supabase
      .from('sessions')
      .select('id, customers(email, name)')
      .eq('id', sessionId)
      .single();

    const customer = Array.isArray(session?.customers) ? session.customers[0] : session?.customers;

    if (customer) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
        to: customer.email,
        subject: 'Balance payment received ✓',
        html: `<p>Hi ${customer.name?.split(' ')[0]},</p><p>Your balance payment has been received. See you at pickup!</p>`,
      });
    }

    const response = NextResponse.redirect(new URL(`/session/${sessionId}?balance=paid`, request.url));
    return response;
  }

  return NextResponse.redirect(new URL(`/payment?error=balance_failed`, request.url));
}
