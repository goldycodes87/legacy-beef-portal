export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { session_id, payment_method_type, coupon_code } = await request.json();

  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select('*')
    .eq('id', session_id)
    .single();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  // Get deposit amount from config
  const depositMap: Record<string, number> = { whole: 850, half: 500, quarter: 250 };
  let depositCents = (depositMap[session.purchase_type] ?? 500) * 100;

  // Apply coupon if provided
  let couponId = null;
  let discountCents = 0;
  if (coupon_code) {
    const { data: coupon } = await supabaseAdmin
      .from('coupon_codes')
      .select('*')
      .eq('code', coupon_code.toUpperCase())
      .eq('redeemed', false)
      .single();

    if (!coupon) return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 });
    if (new Date(coupon.expires_at) < new Date()) return NextResponse.json({ error: 'Coupon code has expired' }, { status: 400 });

    couponId = coupon.id;
    if (coupon.type === 'fixed_amount') discountCents = coupon.value * 100;
    else if (coupon.type === 'percentage') discountCents = Math.round(depositCents * coupon.value / 100);
    else if (coupon.type === 'waive_deposit') discountCents = depositCents;
    
    depositCents = Math.max(0, depositCents - discountCents);
  }

  // Add card surcharge if paying by card
  let surchargeCents = 0;
  if (payment_method_type === 'card') {
    surchargeCents = Math.round(depositCents * 0.03);
    depositCents += surchargeCents;
  }

  // If deposit is waived, skip Stripe
  if (depositCents === 0) {
    return NextResponse.json({ 
      waived: true, 
      session_id,
      coupon_id: couponId,
      discount_cents: discountCents
    });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: depositCents,
    currency: 'usd',
    payment_method_types: payment_method_type === 'card' ? ['card'] : ['us_bank_account'],
    metadata: { session_id, coupon_id: couponId ?? '' },
  });

  return NextResponse.json({
    client_secret: paymentIntent.client_secret,
    amount_cents: depositCents,
    surcharge_cents: surchargeCents,
    discount_cents: discountCents,
    original_cents: (depositMap[session.purchase_type] ?? 500) * 100,
    waived: false,
  });
}
