export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legacylandandcattleco.com';

// Supabase auth client for generating magic links
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

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
    const sessionUrl = `${APP_URL}/session/${session_id}`;

    const depositPaid = amount_cents
      ? amount_cents / 100
      : depositForType(session.purchase_type);

    // 2. Record payment in payments table
    const paymentRecord: Record<string, unknown> = {
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

    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .upsert(paymentRecord, { onConflict: 'stripe_payment_intent_id' });

    if (paymentError) {
      console.warn('Payment record upsert warning:', paymentError.message);
    }

    // 3. Update session status to 'draft' (will be 'deposit_paid' after DB migration)
    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({ status: 'draft' })
      .eq('id', session_id);

    if (updateError) {
      console.error('Error updating session status:', updateError);
    }

    // 4. Generate magic link and send comprehensive confirmation email
    let magicLinkSent = false;
    let magicLinkError: string | null = null;

    try {
      // Use admin.generateLink to get the token without Supabase sending its own email
      const { data: linkData, error: linkError } = await supabaseAuth.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${APP_URL}/auth/callback`,
        },
      });

      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey || resendKey === 're_placeholder_set_in_vercel') {
        console.warn('RESEND_API_KEY not configured — skipping email send');
        magicLinkSent = false;
      } else if (linkError || !linkData?.properties?.action_link) {
        console.error('Failed to generate magic link:', linkError);

        // Fallback: use signInWithOtp and let Supabase send its own email
        const { error: otpError } = await supabaseAuth.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${APP_URL}/auth/callback`,
            shouldCreateUser: true,
            data: { session_id },
          },
        });

        if (otpError) {
          magicLinkError = otpError.message;
          console.error('signInWithOtp fallback failed:', otpError);
        } else {
          magicLinkSent = true;
        }
      } else {
        // We have the magic link — send our comprehensive branded confirmation email
        const actionLink = linkData.properties.action_link;

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
            magicLink: actionLink,
            sessionUrl,
            sessionId: session_id,
          }),
        });

        magicLinkSent = true;

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
  const ORANGE = '#E85D24';
  const GREEN  = '#2D5016';
  const DARK   = '#0F0F0F';
  const GRAY   = '#6B7280';
  const LIGHT  = '#F5F0E8';

  const receiptRow = p.stripeReceiptId
    ? `<tr>
        <td style="color:${GRAY};font-size:13px;padding:4px 0;font-family:Arial,sans-serif;">Receipt ID</td>
        <td style="color:${DARK};font-size:13px;font-weight:600;text-align:right;font-family:monospace;">${p.stripeReceiptId}</td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Reservation is Confirmed — Legacy Land &amp; Cattle</title>
</head>
<body style="margin:0;padding:0;background-color:${LIGHT};font-family:Georgia,Cambria,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${LIGHT};padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.10);max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:${GREEN};padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:1px;">
                Legacy Land &amp; Cattle
              </h1>
              <p style="margin:6px 0 0;color:#C4A46B;font-size:13px;font-family:Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;">
                Grass-Fed Beef Direct from the Ranch
              </p>
            </td>
          </tr>

          <!-- Confirmation Banner -->
          <tr>
            <td style="background-color:#F0F7E8;border-bottom:2px solid ${GREEN};padding:20px 40px;text-align:center;">
              <p style="margin:0;color:${GREEN};font-size:18px;font-weight:700;font-family:Arial,sans-serif;">
                ✅ Your reservation is confirmed!
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 24px;">
              <h2 style="margin:0 0 8px;color:${DARK};font-size:22px;">
                Hey ${p.firstName}! 🎉
              </h2>
              <p style="margin:0 0 28px;color:#555;font-size:15px;font-family:Arial,sans-serif;line-height:1.6;">
                Your deposit has been received and your beef reservation is officially locked in.
                Here's everything you need to know:
              </p>

              <!-- Order Details -->
              <p style="margin:0 0 10px;color:${GRAY};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;font-family:Arial,sans-serif;">
                Order Details
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT};border-radius:10px;margin-bottom:20px;">
                <tr><td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:${GRAY};font-size:13px;padding:5px 0;font-family:Arial,sans-serif;">Order Type</td>
                      <td style="color:${DARK};font-size:13px;font-weight:700;text-align:right;font-family:Arial,sans-serif;">${p.purchaseType}</td>
                    </tr>
                    <tr>
                      <td style="color:${GRAY};font-size:13px;padding:5px 0;font-family:Arial,sans-serif;">Animal</td>
                      <td style="color:${DARK};font-size:13px;font-weight:700;text-align:right;font-family:Arial,sans-serif;">${p.animalName}</td>
                    </tr>
                    <tr>
                      <td style="color:${GRAY};font-size:13px;padding:5px 0;font-family:Arial,sans-serif;">Butcher Date</td>
                      <td style="color:${DARK};font-size:13px;font-weight:700;text-align:right;font-family:Arial,sans-serif;">${p.butcherDate}</td>
                    </tr>
                    <tr>
                      <td style="color:${GRAY};font-size:13px;padding:5px 0;font-family:Arial,sans-serif;">Est. Ready Date</td>
                      <td style="color:${DARK};font-size:13px;font-weight:700;text-align:right;font-family:Arial,sans-serif;">${p.estimatedReady}</td>
                    </tr>
                    <tr>
                      <td style="color:${GRAY};font-size:13px;padding:5px 0;border-top:1px solid #e5e7eb;padding-top:10px;font-family:Arial,sans-serif;">Price Per Lb</td>
                      <td style="color:${DARK};font-size:13px;font-weight:700;text-align:right;border-top:1px solid #e5e7eb;padding-top:10px;font-family:Arial,sans-serif;">$${p.pricePerLb.toFixed(2)}/lb</td>
                    </tr>
                  </table>
                </td></tr>
              </table>

              <!-- Deposit Receipt -->
              <p style="margin:0 0 10px;color:${GRAY};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;font-family:Arial,sans-serif;">
                Deposit Receipt
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F7E8;border:1px solid #c3dfa0;border-radius:10px;margin-bottom:28px;">
                <tr><td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:${GRAY};font-size:13px;padding:5px 0;font-family:Arial,sans-serif;">Amount Paid</td>
                      <td style="color:${GREEN};font-size:16px;font-weight:700;text-align:right;font-family:Arial,sans-serif;">$${p.depositPaid.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style="color:${GRAY};font-size:13px;padding:5px 0;font-family:Arial,sans-serif;">Payment Method</td>
                      <td style="color:${DARK};font-size:13px;font-weight:600;text-align:right;font-family:Arial,sans-serif;">Stripe (Credit/Debit Card)</td>
                    </tr>
                    ${receiptRow}
                  </table>
                </td></tr>
              </table>

              <!-- CTA Button — Start Cut Sheet -->
              <p style="margin:0 0 14px;color:#555;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;text-align:center;">
                Next step: tell the butcher exactly how you want your beef cut.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td align="center">
                    <a href="${p.magicLink}"
                       style="display:inline-block;background-color:${ORANGE};color:#ffffff;text-decoration:none;padding:18px 44px;border-radius:10px;font-size:17px;font-weight:700;font-family:Arial,sans-serif;letter-spacing:0.5px;">
                      Start My Cut Sheet &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px;color:#aaa;font-size:11px;font-family:Arial,sans-serif;text-align:center;">
                This magic link is single-use and expires in 24 hours.
              </p>
              <p style="margin:0 0 28px;font-size:10px;color:#ccc;font-family:monospace;text-align:center;word-break:break-all;">
                ${p.magicLink}
              </p>

              <hr style="border:none;border-top:1px solid #eee;margin-bottom:24px;">

              <!-- Pickup Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:20px;margin-bottom:24px;">
                <tr><td style="padding:16px 20px;">
                  <p style="color:${ORANGE};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 10px;font-family:Arial,sans-serif;">
                    Pickup Information
                  </p>
                  <p style="color:${DARK};font-size:14px;font-weight:600;margin:0 0 4px;font-family:Arial,sans-serif;">
                    6105 Burgess Rd
                  </p>
                  <p style="color:${DARK};font-size:14px;font-weight:600;margin:0 0 12px;font-family:Arial,sans-serif;">
                    Colorado Springs, CO 80908
                  </p>
                  <p style="color:#555;font-size:13px;margin:0;font-family:Arial,sans-serif;line-height:1.5;">
                    Balance is due at pickup. We'll contact you with the exact pickup date once your animal goes to processing.
                  </p>
                </td></tr>
              </table>

              <!-- What's Next -->
              <h3 style="margin:0 0 12px;color:${GREEN};font-size:16px;">What Happens Next?</h3>
              <p style="margin:0 0 8px;color:#555;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;">
                1. <strong>Cut Sheet</strong> — Fill out your cut sheet so the butcher knows how you want your beef cut (steaks, roasts, ground beef, etc.)
              </p>
              <p style="margin:0 0 8px;color:#555;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;">
                2. <strong>Processing</strong> — Your animal goes to the butcher on the scheduled date. We'll keep you updated.
              </p>
              <p style="margin:0;color:#555;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;">
                3. <strong>Pickup</strong> — Once your beef is ready, we'll contact you to schedule pickup. Balance due at that time.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:24px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0 0 4px;color:#888;font-size:13px;font-weight:600;font-family:Arial,sans-serif;">
                Legacy Land &amp; Cattle
              </p>
              <p style="margin:0 0 4px;color:#aaa;font-size:12px;font-family:Arial,sans-serif;">
                6105 Burgess Rd, Colorado Springs, CO 80908
              </p>
              <p style="margin:0;color:#aaa;font-size:12px;font-family:Arial,sans-serif;">
                <a href="tel:7194595151" style="color:#aaa;text-decoration:none;">719.459.5151</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:orders@legacylandandcattleco.com" style="color:${ORANGE};text-decoration:none;">orders@legacylandandcattleco.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
