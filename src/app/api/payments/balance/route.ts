export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getConfig, getSurchargeCents } from '@/lib/config';

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SQUARE_ENVIRONMENT === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox,
});

export async function POST(request: NextRequest) {
  const { session_id, source_id, idempotency_key } = await request.json();
  const supabase = getSupabaseAdmin();

  const { data: session } = await supabase
    .from('sessions')
    .select(`
      id, balance_due, balance_paid, purchase_type,
      customers (id, name, email),
      animals (name, butcher_date)
    `)
    .eq('id', session_id)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Never charge a balance twice.
  if ((session as any).balance_paid) {
    return NextResponse.json({ success: true, already_paid: true });
  }

  const { data: existingBalance } = await supabase
    .from('payments')
    .select('id')
    .eq('session_id', session_id)
    .eq('type', 'balance')
    .eq('status', 'paid')
    .maybeSingle();

  if (existingBalance) {
    return NextResponse.json({ success: true, already_paid: true });
  }

  const balanceDue = (session as any).balance_due || 0;
  if (balanceDue <= 0) {
    return NextResponse.json({ error: 'No balance due' }, { status: 400 });
  }

  const config = await getConfig();
  const balanceCents = Math.round(balanceDue * 100);
  const surchargeCents = getSurchargeCents(balanceCents, config);
  const totalCents = balanceCents + surchargeCents;

  const customer = Array.isArray((session as any).customers)
    ? (session as any).customers[0] : (session as any).customers;

  try {
    const { payment } = await squareClient.payments.create({
      sourceId: source_id,
      // One key per payment attempt, so Square collapses retries.
      idempotencyKey: typeof idempotency_key === 'string' && idempotency_key
        ? idempotency_key.slice(0, 45)
        : randomUUID(),
      amountMoney: {
        amount: BigInt(totalCents),
        currency: 'USD',
      },
      locationId: process.env.SQUARE_LOCATION_ID!,
      note: `Balance payment — Legacy Land & Cattle`,
      buyerEmailAddress: customer?.email || undefined,
    });

    if (!payment || payment.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Record payment
    await supabase.from('payments').insert({
      session_id,
      type: 'balance',
      method: 'card',
      amount_cents: totalCents,
      surcharge_cents: surchargeCents,
      status: 'paid',
      paid_at: new Date().toISOString(),
      square_payment_id: payment.id,
    });

    // Update session
    await supabase.from('sessions').update({
      balance_paid: true,
      balance_paid_at: new Date().toISOString(),
      balance_payment_method: 'card',
      status: 'beef_ready',
    }).eq('id', session_id);

    // Send confirmation email to Grant
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY!);
      const purchaseLabel = (session as any).purchase_type === 'whole' ? 'Whole Beef'
        : (session as any).purchase_type === 'half' ? 'Half Beef' : 'Quarter Beef';
      await resend.emails.send({
        from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
        to: 'orders@legacylandandcattleco.com',
        subject: `Balance Paid — ${purchaseLabel} — ${customer?.name}`,
        html: `<ul>
          <li><strong>Customer:</strong> ${customer?.name} (${customer?.email})</li>
          <li><strong>Order:</strong> ${purchaseLabel}</li>
          <li><strong>Balance Paid:</strong> $${(totalCents / 100).toFixed(2)}</li>
          <li><strong>Payment:</strong> Square Card</li>
          <li><strong>Square Payment ID:</strong> ${payment.id}</li>
        </ul>`,
      });
    } catch (emailErr) {
      console.error('Balance email error:', emailErr);
    }

    return NextResponse.json({ success: true, payment_id: payment.id });

  } catch (err: any) {
    console.error('Square balance payment error:', err);
    const message = err?.errors?.[0]?.detail || err?.message || 'Payment failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
