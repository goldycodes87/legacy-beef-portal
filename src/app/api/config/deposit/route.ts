export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getConfig, getDepositAmount, getSurchargeCents } from '@/lib/config';

export async function POST(request: NextRequest) {
  const { session_id, coupon_code } = await request.json();
  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select('purchase_type, is_splitting, deposit_amount, animals (animal_type)')
    .eq('id', session_id)
    .single();
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const animal = Array.isArray((session as any).animals)
    ? (session as any).animals[0]
    : (session as any).animals;

  const config = await getConfig();
  // The deposit quoted at booking wins, so a later price change never
  // re-prices an existing reservation.
  const depositDollars =
    (session as any).deposit_amount ??
    getDepositAmount(
      config,
      session.purchase_type,
      (session as any).is_splitting || false,
      animal?.animal_type
    );
  let depositCents = Math.round(depositDollars * 100);
  let discountCents = 0;

  if (coupon_code) {
    const { data: coupon } = await supabaseAdmin
      .from('coupon_codes').select('*')
      .eq('code', coupon_code.toUpperCase()).eq('redeemed', false).single();
    if (coupon && new Date(coupon.expires_at) >= new Date()) {
      if (coupon.type === 'fixed_amount') discountCents = Math.round(coupon.value * 100);
      else if (coupon.type === 'percentage') discountCents = Math.round(depositCents * coupon.value / 100);
      else if (coupon.type === 'waive_deposit') discountCents = depositCents;
      depositCents = Math.max(0, depositCents - discountCents);
    }
  }

  if (depositCents === 0) return NextResponse.json({ waived: true });

  const surchargeCents = getSurchargeCents(depositCents, config);
  return NextResponse.json({
    amount_cents: depositCents + surchargeCents,
    surcharge_cents: surchargeCents,
    discount_cents: discountCents,
    original_cents: depositCents,
  });
}
