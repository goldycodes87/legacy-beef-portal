export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getConfig, getDepositAmount, getSurchargeCents } from '@/lib/config';

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
  const { session_id, source_id, coupon_code, idempotency_key } = await request.json();

  if (!session_id || !source_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Never charge a deposit twice. A double-click, a browser retry, or a
  // network timeout followed by a retry all land here.
  const { data: existingDeposit } = await supabaseAdmin
    .from('payments')
    .select('id, amount_cents')
    .eq('session_id', session_id)
    .eq('type', 'deposit')
    .eq('status', 'paid')
    .maybeSingle();

  if (existingDeposit) {
    return NextResponse.json({
      success: true,
      already_paid: true,
      session_id,
      amount_cents: existingDeposit.amount_cents,
    });
  }

  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select(`
      id, purchase_type, is_splitting, group_size, deposit_amount,
      price_per_lb, animal_id,
      customers (id, name, email),
      animals (name, animal_type, butcher_date, estimated_ready_date, price_per_lb)
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
  // The deposit quoted at booking wins, so a later price change never
  // re-prices an existing reservation.
  const baseDepositDollars =
    (session as any).deposit_amount ??
    getDepositAmount(config, session.purchase_type, isSplitting, animal?.animal_type);

  let depositCents = Math.round(baseDepositDollars * 100);

  // Apply coupon
  let couponId = null;
  if (coupon_code) {
    const { data: coupon } = await supabaseAdmin
      .from('coupon_codes')
      .select('*')
      .eq('code', coupon_code.toUpperCase())
      .eq('redeemed', false)
      .single();
    if (!coupon) {
      return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 });
    }
    if (new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Coupon code has expired' }, { status: 400 });
    }
    couponId = coupon.id;
    let discountCents = 0;
    if (coupon.type === 'fixed_amount') discountCents = Math.round(coupon.value * 100);
    else if (coupon.type === 'percentage') discountCents = Math.round(depositCents * coupon.value / 100);
    else if (coupon.type === 'waive_deposit') discountCents = depositCents;
    depositCents = Math.max(0, depositCents - discountCents);
  }

  if (depositCents === 0) {
    return NextResponse.json({ waived: true, session_id, coupon_id: couponId });
  }

  const surchargeCents = getSurchargeCents(depositCents, config);
  const totalCents = depositCents + surchargeCents;

  console.log('Square charge - depositCents:', depositCents, 'surchargeCents:', surchargeCents, 'totalCents:', totalCents);

  try {
    const { payment } = await squareClient.payments.create({
      sourceId: source_id,
      // The client sends one key per payment attempt, so Square collapses
      // retries of the same attempt into a single charge.
      idempotencyKey: typeof idempotency_key === 'string' && idempotency_key
        ? idempotency_key.slice(0, 45)
        : randomUUID(),
      amountMoney: {
        amount: BigInt(totalCents),
        currency: 'USD',
      },
      locationId: process.env.SQUARE_LOCATION_ID!,
      note: `${purchaseTypeLabel(session.purchase_type)} deposit — Legacy Land & Cattle`,
      buyerEmailAddress: customer?.email || undefined,
    });

    if (!payment || payment.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Record payment. The card has been charged by this point, so a failure
    // here means money moved with no record — log loudly with the Square id so
    // it can be reconciled by hand.
    const { error: paymentInsertError } = await supabaseAdmin.from('payments').insert({
      session_id,
      type: 'deposit',
      method: 'card',
      amount_cents: totalCents,
      surcharge_cents: surchargeCents,
      status: 'paid',
      paid_at: new Date().toISOString(),
      square_payment_id: payment.id,
    });

    if (paymentInsertError) {
      console.error(
        `PAYMENT RECORDED IN SQUARE BUT NOT IN DATABASE. square_payment_id=${payment.id} ` +
        `session_id=${session_id} amount_cents=${totalCents}`,
        paymentInsertError
      );
    }

    // Update session
    const sessionUpdate: Record<string, unknown> = { status: 'deposit_paid' };
    if (session.purchase_type === 'quarter') sessionUpdate.cut_sheet_complete = true;
    const { error: sessionUpdateError } = await supabaseAdmin
      .from('sessions').update(sessionUpdate).eq('id', session_id);

    if (sessionUpdateError) {
      console.error(
        `Deposit charged but session not advanced. square_payment_id=${payment.id} session_id=${session_id}`,
        sessionUpdateError
      );
    }

    // Mark coupon redeemed
    if (couponId) {
      await supabaseAdmin.from('coupon_codes')
        .update({ redeemed: true, redeemed_at: new Date().toISOString() })
        .eq('id', couponId);
    }

    // Send confirmation email
    try {
      const { createAccessToken } = await import('@/lib/access-token');
      const butcherDate = animal?.butcher_date
        ? new Date(new Date(animal.butcher_date).getTime() + 60 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 150 * 24 * 60 * 60 * 1000);
      const accessToken = await createAccessToken(session_id, butcherDate);
      const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';
      const accessLink = `${APP_URL}/api/token/${accessToken}`;
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY!);
      const { build, depositConfirmation } = await import('@/lib/email-content');
      const firstName = customer?.name?.split(' ')[0] ?? 'there';
      const pricePerLb = Number((session as any).price_per_lb) || Number(animal?.price_per_lb) || 0;
      const depositPaid = totalCents / 100;

      const { subject: depositSubject, html: depositHtml } = build(depositConfirmation, {
        firstName,
        purchaseLabel: purchaseTypeLabel(session.purchase_type),
        animalName: animal?.name || 'TBD',
        butcherDate: animal?.butcher_date
          ? new Date(animal.butcher_date + 'T00:00:00').toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })
          : 'TBD',
        estimatedReady: null,
        pricePerLb,
        depositPaid,
        cutSheetUrl: accessLink,
      });

      await resend.emails.send({
        from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
        to: customer.email,
        subject: depositSubject,
        html: depositHtml,
      });

      await resend.emails.send({
        from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
        to: 'grant@legacylandandcattleco.com',
        subject: `New Order: ${purchaseTypeLabel(session.purchase_type)} — ${customer?.name}`,
        html: `<ul>
          <li><strong>Customer:</strong> ${customer?.name} (${customer?.email})</li>
          <li><strong>Order:</strong> ${purchaseTypeLabel(session.purchase_type)}</li>
          <li><strong>Deposit:</strong> $${depositPaid.toFixed(2)}</li>
          <li><strong>Square Payment ID:</strong> ${payment.id}</li>
        </ul>`,
      });

      // Phone notification too — the email alone was easy to miss, and the
      // deposit is the moment that matters.
      try {
        await fetch(`${request.nextUrl.origin}/api/notify-admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-notify-secret': process.env.ADMIN_NOTIFY_SECRET || '',
          },
          body: JSON.stringify({
            title: '💰 Deposit Paid',
            body: `${customer?.name} paid ${depositPaid.toFixed(2)} — ${purchaseTypeLabel(session.purchase_type)}`,
            url: '/slots',
          }),
        });
      } catch (pushErr) {
        console.error('Deposit push failed:', pushErr);
      }

      const { sendAdminSms } = await import('@/lib/sms');
      await sendAdminSms(
        `💰 Deposit paid: ${customer?.name} — ${depositPaid.toFixed(2)} (${purchaseTypeLabel(session.purchase_type)})`
      );

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

    return NextResponse.json({
      success: true,
      session_id,
      payment_id: payment.id,
      amount_cents: totalCents,
    });

  } catch (err: any) {
    console.error('Square payment error:', err);
    const message = err?.errors?.[0]?.detail || err?.message || 'Payment failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
