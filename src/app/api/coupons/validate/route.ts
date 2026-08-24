export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getConfig, getDepositAmount } from '@/lib/config';

export async function POST(request: NextRequest) {
  const { code, session_id } = await request.json();
  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });

  const { data: coupon } = await supabaseAdmin
    .from('coupon_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('redeemed', false)
    .single();

  if (!coupon) return NextResponse.json({ error: 'Code not found or already used' }, { status: 400 });
  if (new Date(coupon.expires_at) < new Date()) return NextResponse.json({ error: 'Code has expired' }, { status: 400 });

  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select('purchase_type, is_splitting, deposit_amount, animals (animal_type)')
    .eq('id', session_id)
    .single();

  const animal = Array.isArray((session as any)?.animals)
    ? (session as any).animals[0]
    : (session as any)?.animals;

  const depositDollars =
    (session as any)?.deposit_amount ??
    getDepositAmount(
      await getConfig(),
      session?.purchase_type ?? 'half',
      (session as any)?.is_splitting || false,
      animal?.animal_type
    );
  const depositCents = Math.round(depositDollars * 100);

  let discountCents = 0;
  let message = '';

  if (coupon.type === 'fixed_amount') {
    discountCents = Math.min(Math.round(coupon.value * 100), depositCents);
    message = `$${coupon.value} off your deposit applied!`;
  } else if (coupon.type === 'percentage') {
    discountCents = Math.round(depositCents * coupon.value / 100);
    message = `${coupon.value}% off your deposit applied!`;
  } else if (coupon.type === 'waive_deposit') {
    discountCents = depositCents;
    message = 'Deposit waived! No payment required.';
  } else if (coupon.type === 'percentage_balance') {
    message = `${coupon.value}% off your final balance — applied at pickup!`;
  }

  return NextResponse.json({
    valid: true,
    type: coupon.type,
    discount_amount: Math.round(discountCents / 100),
    new_deposit: Math.round((depositCents - discountCents) / 100),
    message,
  });
}
