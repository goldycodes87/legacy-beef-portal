export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legacylandandcattleco.com';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  if (!sessionId) {
    return NextResponse.redirect(new URL('/?error=missing_session', request.url));
  }

  if (redirectStatus === 'succeeded' && paymentIntentId) {
    // Update session status
    await supabaseAdmin
      .from('sessions')
      .update({
        status: 'deposit_paid',
        deposit_paid: true,
        deposit_paid_at: new Date().toISOString(),
        payment_method: 'card',
      })
      .eq('id', sessionId);

    // Call confirm to create payment record and send confirmation email
    try {
      // Fetch amount from Stripe so confirm can record it
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const amountCents = paymentIntent.amount;

      await fetch(`${APP_URL}/api/payments/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          stripe_payment_intent_id: paymentIntentId,
          amount_cents: amountCents,
        }),
      });
    } catch (err) {
      console.error('Failed to call payments/confirm:', err);
    }

    const response = NextResponse.redirect(new URL(`/payment-success?session_id=${sessionId}`, request.url));
    response.cookies.set('payment_just_completed', sessionId, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 30,
      path: '/',
    });
    return response;
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
