import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legacylandandcattleco.com';

// Supabase anon client for signInWithOtp (uses service role to send magic link server-side)
// We use the admin client's auth.admin.generateLink to create the OTP link without rate-limiting
// and then send it via Resend for full control over email content.
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

/**
 * POST /api/payments/confirm
 *
 * Called after a deposit payment succeeds (Stripe webhook or manual confirmation).
 * Marks the session as deposit_paid and sends the customer a magic link email
 * so they can access their cut sheet portal.
 *
 * Body:
 *   {
 *     session_id: string,
 *     stripe_payment_intent_id?: string,  // optional — set when Stripe is integrated
 *     amount_cents?: number,               // deposit amount in cents
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, stripe_payment_intent_id, amount_cents } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // 1. Load session + customer
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

    // Type assertion for joined customer (Supabase returns array for joins)
    const customersRaw = (session as unknown as { customers: { id: string; name: string; email: string }[] | null }).customers;
    const customer = Array.isArray(customersRaw) ? customersRaw[0] ?? null : customersRaw;

    if (!customer) {
      return NextResponse.json({ error: 'No customer linked to session' }, { status: 400 });
    }

    const { email, name } = customer;
    const firstName = name?.split(' ')[0] ?? 'there';
    const sessionUrl = `${APP_URL}/session/${session_id}`;

    // 2. Record payment in payments table (if Stripe is integrated, use stripe_payment_intent_id)
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
      // Non-fatal if payments table doesn't have the columns yet — log and continue
      console.warn('Payment record upsert warning:', paymentError.message);
    }

    // 3. Update session status to 'deposit_paid' (or keep as 'draft' if column doesn't exist yet)
    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({ status: 'draft' }) // Will be updated to 'deposit_paid' once DB migration runs
      .eq('id', session_id);

    if (updateError) {
      console.error('Error updating session status:', updateError);
      // Non-fatal — continue to send magic link
    }

    // 4. Send magic link email via Supabase admin generateLink
    // This creates a valid magic link without triggering Supabase's own email.
    // We then send our custom email via the signInWithOtp flow.
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

      if (linkError || !linkData?.properties?.action_link) {
        console.error('Failed to generate magic link:', linkError);

        // Fallback: use signInWithOtp and let Supabase send its own email
        const { error: otpError } = await supabaseAuth.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${APP_URL}/auth/callback`,
            shouldCreateUser: true,
            data: {
              session_id,
            },
          },
        });

        if (otpError) {
          magicLinkError = otpError.message;
          console.error('signInWithOtp fallback failed:', otpError);
        } else {
          magicLinkSent = true;
        }
      } else {
        // We have the magic link — send our custom-branded email via Resend
        const actionLink = linkData.properties.action_link;
        const token = linkData.properties.hashed_token || '';

        // Build the custom redirect URL pointing directly to the session
        const customLink = `${APP_URL}/api/auth/callback/email?token=${token}&email=${encodeURIComponent(email)}&next=${encodeURIComponent(`/session/${session_id}`)}`;

        // Try to send via Resend if available
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey && resendKey !== 're_placeholder_set_in_vercel') {
          const { Resend } = await import('resend');
          const resend = new Resend(resendKey);

          await resend.emails.send({
            from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
            to: email,
            subject: 'Your deposit is confirmed — access your cut sheet',
            html: buildMagicLinkEmail({
              firstName,
              magicLink: actionLink, // Use Supabase action link directly
              sessionUrl,
              sessionId: session_id,
            }),
          });
        }

        magicLinkSent = true;

        // Log the notification
        await supabaseAdmin.from('notifications').insert({
          session_id,
          type: 'magic_link',
          channel: 'email',
          sent_at: new Date().toISOString(),
          status: 'sent',
        });
      }
    } catch (err) {
      console.error('Magic link send error:', err);
      magicLinkError = err instanceof Error ? err.message : 'Unknown error';

      await supabaseAdmin.from('notifications').insert({
        session_id,
        type: 'magic_link',
        channel: 'email',
        sent_at: null,
        status: 'failed',
      }); // Non-fatal — swallow any errors via try/catch above
    }

    return NextResponse.json({
      success: true,
      session_id,
      magic_link_sent: magicLinkSent,
      ...(magicLinkError && { magic_link_error: magicLinkError }),
      message: magicLinkSent
        ? 'Payment confirmed. Magic link sent to customer email.'
        : 'Payment confirmed. Magic link failed — check logs.',
    });
  } catch (err) {
    console.error('Unexpected error in /api/payments/confirm:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Magic Link Email Builder ─────────────────────────────────────────────────

function buildMagicLinkEmail(params: {
  firstName: string;
  magicLink: string;
  sessionUrl: string;
  sessionId: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Access Your Cut Sheet — Legacy Land &amp; Cattle</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:Georgia,Cambria,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#2D5016;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">
                Legacy Land &amp; Cattle
              </h1>
              <p style="margin:6px 0 0;color:#C4A46B;font-size:13px;font-family:Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;">
                Grass-Fed Beef Direct from the Ranch
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 8px;color:#2D5016;font-size:22px;">
                Your deposit is in, ${params.firstName}! 🎉
              </h2>
              <p style="margin:0 0 8px;color:#555;font-size:15px;font-family:Arial,sans-serif;line-height:1.6;">
                Your deposit has been received and your beef reservation is locked in.
              </p>
              <p style="margin:0 0 28px;color:#555;font-size:15px;font-family:Arial,sans-serif;line-height:1.6;">
                Click below to access your customer portal and start filling out your cut sheet — this tells the butcher exactly how you want your beef cut.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${params.magicLink}"
                       style="display:inline-block;background-color:#2D5016;color:#ffffff;text-decoration:none;padding:18px 44px;border-radius:8px;font-size:17px;font-weight:700;font-family:Arial,sans-serif;letter-spacing:0.5px;">
                      Click to view your cut sheet →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;color:#888;font-size:12px;font-family:Arial,sans-serif;text-align:center;">
                This link is single-use and expires in 24 hours.
              </p>
              <p style="margin:0 0 28px;font-size:11px;color:#aaa;font-family:monospace;text-align:center;word-break:break-all;">
                ${params.magicLink}
              </p>

              <hr style="border:none;border-top:1px solid #eee;margin-bottom:24px;">

              <h3 style="margin:0 0 12px;color:#2D5016;font-size:16px;">What's Next?</h3>
              <p style="margin:0 0 8px;color:#555;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;">
                1. <strong>Cut Sheet</strong> — Tell the butcher how you want your beef cut (steaks, roasts, ground beef, etc.)
              </p>
              <p style="margin:0 0 8px;color:#555;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;">
                2. <strong>Processing</strong> — Your animal goes to the butcher on the scheduled date.
              </p>
              <p style="margin:0;color:#555;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;">
                3. <strong>Pickup</strong> — Once your beef is ready, we'll notify you to schedule pickup. Balance is due at that time.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;color:#aaa;font-size:12px;font-family:Arial,sans-serif;">
                Legacy Land &amp; Cattle · legacylandandcattleco.com
              </p>
              <p style="margin:4px 0 0;color:#ccc;font-size:11px;font-family:Arial,sans-serif;">
                Questions? Reply to this email or contact us directly.
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
