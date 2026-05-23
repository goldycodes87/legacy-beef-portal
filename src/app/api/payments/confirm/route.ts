export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { emailBase, ctaButton, orderCard } from '@/lib/email-templates';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legacylandandcattleco.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function purchaseTypeLabel(type: string): string {
  switch (type) {
    case 'whole':   return 'Whole Beef';
    case 'half':    return 'Half Beef';
    case 'quarter': return 'Quarter Beef';
    default:        return type;
  }
}

function depositForType(type: string): number {
  switch (type) {
    case 'whole':   return 850;
    case 'half':    return 500;
    case 'quarter': return 250;
    default:        return 500;
  }
}

/**
 * POST /api/payments/confirm
 *
 * Called after a deposit payment succeeds (Stripe webhook or manual confirmation).
 * Marks the session as deposit_paid and sends the customer a single comprehensive
 * confirmation email with order details, deposit receipt, magic link, and next steps.
 *
 * Body:
 *   {
 *     session_id: string,
 *     stripe_payment_intent_id?: string,  // optional — set when Stripe is integrated
 *     amount_cents?: number,               // deposit amount in cents
 *     stripe_receipt_id?: string,          // Stripe receipt/charge ID
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, stripe_payment_intent_id, amount_cents, stripe_receipt_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // 1. Load session + customer + animal
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select(`
        id,
        customer_id,
        animal_id,
        purchase_type,
        status,
        customers (
          id,
          name,
          email
        )
      `)
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.error('Session not found:', sessionError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Type assertion for joined customer
    const customersRaw = (session as unknown as { customers: { id: string; name: string; email: string }[] | null }).customers;
    const customer = Array.isArray(customersRaw) ? customersRaw[0] ?? null : customersRaw;

    if (!customer) {
      return NextResponse.json({ error: 'No customer linked to session' }, { status: 400 });
    }

    // Load animal for order details
    const { data: animal, error: animalError } = await supabaseAdmin
      .from('animals')
      .select('id, name, butcher_date, estimated_ready_date, price_per_lb, hanging_weight_lbs')
      .eq('id', session.animal_id)
      .single();

    if (animalError || !animal) {
      console.error('Animal not found:', animalError);
      return NextResponse.json({ error: 'Animal not found' }, { status: 404 });
    }

    const { email, name } = customer;
    const firstName = name?.split(' ')[0] ?? 'there';
    const sessionUrl = `${APP_URL}/access/${session_id}`;

    const depositPaid = amount_cents
      ? amount_cents / 100
      : depositForType(session.purchase_type);

    // 2. Record payment in payments table
    const allowedMethods = ['card', 'echeck', 'cash', 'check'];
    const method = allowedMethods.includes(body.method) ? body.method : 'card';
    const paymentRecord: Record<string, unknown> = {
      method: method,
      session_id,
      type: 'deposit',
      status: 'paid',
      paid_at: new Date().toISOString(),
    };
    if (stripe_payment_intent_id) {
      paymentRecord.stripe_payment_intent_id = stripe_payment_intent_id;
    }
    if (amount_cents) {
      paymentRecord.amount_cents = amount_cents;
    }

    // Check if payment already exists for this intent
    const { data: existing } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('stripe_payment_intent_id', stripe_payment_intent_id)
      .single();
    
    const { error: paymentError } = existing 
      ? { error: null }
      : await supabaseAdmin.from('payments').insert(paymentRecord);

    if (paymentError) {
      console.warn('Payment record upsert warning:', paymentError.message);
    }

    // 3. Update session status to 'deposit_paid'
    // For quarter buyers, also auto-complete the cut sheet (they use the house cut sheet)
    const sessionUpdate: Record<string, unknown> = { status: 'deposit_paid' };
    if (session.purchase_type === 'quarter') {
      sessionUpdate.cut_sheet_complete = true;
    }

    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update(sessionUpdate)
      .eq('id', session_id);

    if (updateError) {
      console.error('Error updating session status:', updateError);
    }

    // Generate access token for one-click email link
    const { createAccessToken } = await import('@/lib/access-token');
    const butcherDate = animal?.butcher_date 
      ? new Date(animal.butcher_date) 
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const accessToken = await createAccessToken(session_id, butcherDate);
    const accessLink = `${APP_URL}/api/token/${accessToken}`;

    // 4. Send comprehensive confirmation email
    // No magic link needed — email contains permanent /access/[session_id] link
    const magicLinkSent = true;
    let magicLinkError: string | null = null;

    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey || resendKey === 're_placeholder_set_in_vercel') {
        console.warn('RESEND_API_KEY not configured — skipping email send');
      } else {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);

        await resend.emails.send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: email,
          subject: 'Your Legacy Land & Cattle Reservation is Confirmed',
          html: buildConfirmationEmail({
            firstName,
            name,
            purchaseType: purchaseTypeLabel(session.purchase_type),
            animalName: animal.name,
            butcherDate: formatDate(animal.butcher_date),
            estimatedReady: formatDate(animal.estimated_ready_date),
            pricePerLb: Number(animal.price_per_lb),
            depositPaid,
            stripeReceiptId: stripe_receipt_id || stripe_payment_intent_id || null,
            magicLink: accessLink,
            sessionUrl: accessLink,
            sessionId: session_id,
          }),
        });

        // Send order notification to Grant
        await resend.emails.send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: 'orders@legacylandandcattleco.com',
          subject: `New Order: ${purchaseTypeLabel(session.purchase_type)} — ${name}`,
          html: `<p>New reservation placed.</p>
          <ul>
          <li><strong>Customer:</strong> ${name} (${email})</li>
          <li><strong>Order:</strong> ${purchaseTypeLabel(session.purchase_type)}</li>
          <li><strong>Animal:</strong> ${animal.name}</li>
          <li><strong>Butcher Date:</strong> ${formatDate(animal.butcher_date)}</li>
          <li><strong>Deposit:</strong> $${depositPaid.toFixed(2)}</li>
          <li><strong>Price/lb:</strong> $${Number(animal.price_per_lb).toFixed(2)}</li>
          </ul>`,
        });

        await supabaseAdmin.from('notifications').insert({
          session_id,
          type: 'payment_confirmation',
          channel: 'email',
          sent_at: new Date().toISOString(),
          status: 'sent',
        });
      }
    } catch (err) {
      console.error('Confirmation email send error:', err);
      magicLinkError = err instanceof Error ? err.message : 'Unknown error';

      await supabaseAdmin.from('notifications').insert({
        session_id,
        type: 'payment_confirmation',
        channel: 'email',
        sent_at: null,
        status: 'failed',
      });
    }

    return NextResponse.json({
      success: true,
      session_id,
      magic_link_sent: magicLinkSent,
      ...(magicLinkError && { magic_link_error: magicLinkError }),
      message: magicLinkSent
        ? 'Payment confirmed. Confirmation email sent to customer.'
        : 'Payment confirmed. Confirmation email failed — check logs.',
    });
  } catch (err) {
    console.error('Unexpected error in /api/payments/confirm:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Comprehensive Confirmation Email Builder ─────────────────────────────────

interface ConfirmationEmailParams {
  firstName: string;
  name: string;
  purchaseType: string;
  animalName: string;
  butcherDate: string;
  estimatedReady: string;
  pricePerLb: number;
  depositPaid: number;
  stripeReceiptId: string | null;
  magicLink: string;
  sessionUrl: string;
  sessionId: string;
}

function buildConfirmationEmail(p: ConfirmationEmailParams): string {
  const preheader = 'Your deposit is in — here\'s everything you need to know.';

  const content = `
    <!-- Celebratory banner -->
    <table role="presentation" width="100%" style="border-radius:12px;margin:0 0 28px;"><tr><td bgcolor="#1A3D2B" style="background:linear-gradient(135deg,#1A3D2B 0%,#2d6a4f 100%);border-radius:12px;padding:28px 24px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">🎉</div>
      <h2 style="font-family:Georgia,serif;color:white;font-size:26px;
        margin:0 0 8px;font-weight:normal;">
        You're in, ${p.firstName}.
      </h2>
      <p style="color:#C4A46B;font-size:14px;margin:0;
        font-family:Arial,sans-serif;letter-spacing:0.5px;">
        Your spot is locked. Your beef is coming.
      </p>
    </td></tr></table>
    <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;
      line-height:1.7;margin:0 0 24px;">
      We've got your deposit and your reservation is officially on the books. 
      This is real, ranch-direct beef raised right here in Colorado Springs — 
      no grocery store, no middleman. Just our cattle, our butcher, and your freezer.
    </p>

    ${orderCard([
      { label: 'Order Type', value: p.purchaseType },
      { label: 'Animal', value: p.animalName },
      { label: 'Butcher Date', value: p.butcherDate },
      { label: 'Est. Ready', value: p.estimatedReady },
      { label: 'Price/lb', value: `$${p.pricePerLb.toFixed(2)}` },
      { label: 'Deposit Paid', value: `$${p.depositPaid.toFixed(2)}` },
    ])}

    <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">
      <strong style="color:#0F0F0F;">Next step:</strong> Fill out your cut sheet
      to tell our butcher exactly how you want your beef cut — steaks, roasts,
      ground beef, and more.
    </p>

    ${ctaButton('Build My Cut Sheet →', p.magicLink)}

    <p style="color:#aaa;font-size:11px;font-family:Arial,sans-serif;text-align:center;">
      This link is permanent — bookmark it for easy access anytime.
    </p>
  `;

  return emailBase(content, preheader);
}
