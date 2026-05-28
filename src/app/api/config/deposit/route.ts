export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getConfig, getDepositAmount } from '@/lib/config';

export async function POST(request: NextRequest) {
  const { session_id, coupon_code } = await request.json();
  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select('purchase_type, is_splitting, group_size')
    .eq('id', session_id)
    .single();
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const config = await getConfig();
  let depositCents = getDepositAmount(config, session.purchase_type, session.is_splitting || false, session.group_size || 1) * 100;
  let discountCents = 0;

  if (coupon_code) {
    const { data: coupon } = await supabaseAdmin
      .from('coupon_codes').select('*')
      .eq('code', coupon_code.toUpperCase()).eq('redeemed', false).single();
    if (coupon && new Date(coupon.expires_at) >= new Date()) {
      if (coupon.type === 'fixed_amount') discountCents = coupon.value * 100;
      else if (coupon.type === 'percentage') discountCents = Math.round(depositCents * coupon.value / 100);
      else if (coupon.type === 'waive_deposit') discountCents = depositCents;
      depositCents = Math.max(0, depositCents - discountCents);
    }
  }

  if (depositCents === 0) return NextResponse.json({ waived: true });

  const surchargeCents = Math.round(depositCents * 0.03);
  return NextResponse.json({
    amount_cents: depositCents + surchargeCents,
    surcharge_cents: surchargeCents,
    discount_cents: discountCents,
    original_cents: depositCents,
  });
}
