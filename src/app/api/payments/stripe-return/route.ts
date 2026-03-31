import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  if (!sessionId) {
    return NextResponse.redirect(new URL('/?error=missing_session', request.url));
  }

  if (redirectStatus === 'succeeded' && paymentIntentId) {
    await supabaseAdmin
      .from('sessions')
      .update({
        status: 'deposit_paid',
        deposit_paid: true,
        deposit_paid_at: new Date().toISOString(),
        payment_method: 'card',
      })
      .eq('id', sessionId);

    return NextResponse.redirect(new URL(`/payment-success?session_id=${sessionId}`, request.url));
  }

  if (redirectStatus === 'processing') {
    await supabaseAdmin
      .from('sessions')
      .update({ status: 'payment_pending' })
      .eq('id', sessionId);

    return NextResponse.redirect(new URL(`/session/${sessionId}?payment=pending`, request.url));
  }

  return NextResponse.redirect(new URL(`/payment?error=payment_failed`, request.url));
}
