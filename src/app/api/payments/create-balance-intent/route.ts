export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { session_id } = await request.json();

  const { data: session } = await supabase
    .from('sessions')
    .select('id, balance_due, customers(email)')
    .eq('id', session_id)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const balanceCents = Math.round((session.balance_due || 0) * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: balanceCents,
    currency: 'usd',
    metadata: { session_id },
  });

  return NextResponse.json({ client_secret: paymentIntent.client_secret });
}
