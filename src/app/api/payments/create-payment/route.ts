export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getConfig, getDepositAmount } from '@/lib/config';

// Fix BigInt JSON serialization for Square SDK
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

function purchaseTypeLabel(type: string): string {
  switch (type) {
    case 'whole': return 'Whole Beef';
    case 'half': return 'Half Beef';
    case 'quarter': return 'Quarter Beef';
    default: return type;
  }
}

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SQUARE_ENVIRONMENT === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox,
});

export async function POST(request: NextRequest) {
  const { session_id, source_id, coupon_code, verification_token } = await request.json();

  if (!session_id || !source_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select(`
      id, purchase_type, is_splitting, group_size, 
      price_per_lb, animal_id,
      customers (id, name, email),
      animals (name, butcher_date, estimated_ready_date, price_per_lb)
    `)
    .eq('id', session_id)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const customer = Array.isArray((session as any).customers)
    ? (session as any).customers[0] : (session as any).customers;
  const animal = Array.isArray((session as any).animals)
    ? (session as any).animals[0] : (session as any).animals;

  const config = await getConfig();
  const isSplitting = (session as any).is_splitting || false;
  const groupSize = (session as any).group_size || 1;
  const originalDepositAmount = getDepositAmount(config, session.purchase_type, isSplitting, groupSize);
  let depositCents = originalDepositAmount * 100;

  // Apply coupon
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

  // Waived deposit
  if (depositCents === 0) {
    return NextResponse.json({ waived: true, session_id, coupon_id: couponId });
  }

  // Add 3% surcharge
  const surchargeCents = Math.round(depositCents * 0.03);
  const totalCents = depositCents + surchargeCents;

  // Charge Square
  try {
    const paymentResponse = await squareClient.payments.create({
      sourceId: source_id,
      idempotencyKey: `deposit-${session_id}-${Date.now()}`,
      amountMoney: {
        amount: BigInt(totalCents),
        currency: 'USD',
      },
      locationId: process.env.SQUARE_LOCATION_ID!,
      note: `${purchaseTypeLabel(session.purchase_type)} deposit — Legacy Land & Cattle`,
      buyerEmailAddress: customer?.email || undefined,
      ...(verification_token && { verificationToken: verification_token }),
    });

    const payment = paymentResponse.payment;
    if (!payment || payment.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Record payment
    await supabaseAdmin.from('payments').insert({
      session_id,
      type: 'deposit',
      method: 'card',
      amount_cents: totalCents,
      surcharge_cents: surchargeCents,
      status: 'paid',
      paid_at: new Date().toISOString(),
      square_payment_id: payment.id,
    });

    // Update session status
    const sessionUpdate: Record<string, unknown> = { status: 'deposit_paid' };
    if (session.purchase_type === 'quarter') sessionUpdate.cut_sheet_complete = true;
    await supabaseAdmin.from('sessions').update(sessionUpdate).eq('id', session_id);

    // Mark coupon redeemed
    if (couponId) {
      await supabaseAdmin.from('coupon_codes')
        .update({ redeemed: true, redeemed_at: new Date().toISOString() })
        .eq('id', couponId);
    }

    // Generate access token and send confirmation email
    const { createAccessToken } = await import('@/lib/access-token');
    const butcherDate = animal?.butcher_date
      ? new Date(animal.butcher_date)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const accessToken = await createAccessToken(session_id, butcherDate);
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';
    const accessLink = `${APP_URL}/api/token/${accessToken}`;

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && resendKey !== 're_placeholder_set_in_vercel') {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        const { emailBase, ctaButton, orderCard } = await import('@/lib/email-templates');
        const firstName = customer?.name?.split(' ')[0] ?? 'there';
        const pricePerLb = Number((session as any).price_per_lb) || Number(animal?.price_per_lb) || 0;
        const depositPaid = totalCents / 100;

        const content = `
          <table role="presentation" width="100%" style="border-radius:12px;margin:0 0 28px;">
          <tr><td bgcolor="#1A3D2B" style="background:linear-gradient(135deg,#1A3D2B 0%,#2d6a4f 100%);border-radius:12px;padding:28px 24px;text-align:center;">
            <div style="font-size:40px;margin-bottom:8px;">🎉</div>
            <h2 style="font-family:Georgia,serif;color:white;font-size:26px;margin:0 0 8px;font-weight:normal;">
              You're in, ${firstName}.
            </h2>
            <p style="color:#C4A46B;font-size:14px;margin:0;font-family:Arial,sans-serif;">
              Your spot is locked. Your beef is coming.
            </p>
          </td></tr></table>
          <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 24px;">
            We've got your deposit and your reservation is officially on the books.
          </p>
          ${orderCard([
            { label: 'Order Type', value: purchaseTypeLabel(session.purchase_type) },
            { label: 'Animal', value: animal?.name || 'TBD' },
            { label: 'Butcher Date', value: animal?.butcher_date ? new Date(animal.butcher_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD' },
            { label: 'Price/lb', value: `$${pricePerLb.toFixed(2)}` },
            { label: 'Deposit Paid', value: `$${depositPaid.toFixed(2)}` },
          ])}
          <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 16px;">
            <strong style="color:#1A3D2B;">Your next step:</strong> Fill out your cut sheet.
          </p>
          ${ctaButton('Build My Cut Sheet →', accessLink)}
          <p style="color:#9CA3AF;font-size:12px;text-align:center;margin-top:8px;">
            This link is permanent — bookmark it for easy access.
          </p>
        `;

        await resend.emails.send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: customer.email,
          subject: 'Your Legacy Land & Cattle Reservation is Confirmed',
          html: emailBase(content, 'Your spot is locked. Your beef is coming.'),
        });

        await resend.emails.send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: 'orders@legacylandandcattleco.com',
          subject: `New Order: ${purchaseTypeLabel(session.purchase_type)} — ${customer?.name}`,
          html: `<ul>
            <li><strong>Customer:</strong> ${customer?.name} (${customer?.email})</li>
            <li><strong>Order:</strong> ${purchaseTypeLabel(session.purchase_type)}</li>
            <li><strong>Deposit:</strong> $${depositPaid.toFixed(2)}</li>
            <li><strong>Payment:</strong> Square Card</li>
            <li><strong>Square Payment ID:</strong> ${payment.id}</li>
          </ul>`,
        });

        await supabaseAdmin.from('notifications').insert({
          session_id,
          type: 'payment_confirmation',
          channel: 'email',
          sent_at: new Date().toISOString(),
          status: 'sent',
        });
      } catch (emailErr) {
        console.error('Email error:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      session_id,
      payment_id: payment.id,
      amount_cents: totalCents,
    });

  } catch (err: any) {
    console.error('Square payment error:', err);
    const message = err?.errors?.[0]?.detail || 'Payment failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
