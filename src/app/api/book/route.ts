import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legacylandandcattleco.com';

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function slotTypeLabel(type: string) {
  switch (type) {
    case 'whole': return 'Whole Beef';
    case 'half_a': return 'Half Beef (Side A)';
    case 'half_b': return 'Half Beef (Side B)';
    default: return type;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, slot_id } = body;

    // Validate required fields
    if (!name || !email || !phone || !address || !slot_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify the slot is still available
    const { data: slot, error: slotError } = await supabaseAdmin
      .from('butcher_slots')
      .select('*, animal:animals(*)')
      .eq('id', slot_id)
      .eq('status', 'available')
      .single();

    if (slotError || !slot) {
      return NextResponse.json({
        error: 'This slot is no longer available. Please go back and select another.'
      }, { status: 409 });
    }

    // 2. Upsert customer (by email — idempotent)
    let customerId: string;
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingCustomer) {
      // Update existing customer info
      await supabaseAdmin
        .from('customers')
        .update({ name, phone, address })
        .eq('id', existingCustomer.id);
      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({ name, email, phone, address })
        .select('id')
        .single();

      if (customerError || !newCustomer) {
        console.error('Error creating customer:', customerError);
        return NextResponse.json({ error: 'Failed to create customer record' }, { status: 500 });
      }
      customerId = newCustomer.id;
    }

    // 3. Create session record
    const sessionId = uuidv4();
    const purchaseType = slot.slot_type === 'whole' ? 'whole' : 'half';

    const { error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        id: sessionId,
        customer_id: customerId,
        slot_id: slot_id,
        animal_id: slot.animal_id,
        purchase_type: purchaseType,
        status: 'draft',
        partner_approved: false,
        owner_approved: false,
        last_saved: new Date().toISOString(),
      });

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // 4. Update slot to booked
    const { error: updateError } = await supabaseAdmin
      .from('butcher_slots')
      .update({ status: 'booked', customer_id: customerId })
      .eq('id', slot_id);

    if (updateError) {
      console.error('Error updating slot:', updateError);
      // Non-fatal — continue, but log it
    }

    // 5. Generate magic link token via Supabase
    let magicToken = '';
    try {
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${APP_URL}/session/${sessionId}`,
        },
      });
      magicToken = linkData?.properties?.hashed_token || '';
    } catch (err) {
      console.error('Error generating magic link:', err);
      // Non-fatal — email will still work with session link
    }

    const sessionUrl = magicToken
      ? `${APP_URL}/session/${sessionId}?token=${magicToken}`
      : `${APP_URL}/session/${sessionId}`;

    // 6. Send confirmation email via Resend
    const animal = slot.animal;
    const firstName = name.split(' ')[0];

    try {
      await resend.emails.send({
        from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
        to: email,
        subject: 'Your Legacy Land & Cattle beef order is confirmed',
        html: buildConfirmationEmail({
          firstName,
          name,
          animalName: animal.name,
          slotType: slotTypeLabel(slot.slot_type),
          butcherDate: formatDate(animal.butcher_date),
          estimatedReady: formatDate(animal.estimated_ready_date),
          hangingWeight: animal.hanging_weight_lbs,
          pricePerLb: animal.price_per_lb,
          sessionUrl,
        }),
      });

      // Log notification
      await supabaseAdmin.from('notifications').insert({
        session_id: sessionId,
        type: 'confirmation',
        channel: 'email',
        sent_at: new Date().toISOString(),
        status: 'sent',
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Log failed notification
      await supabaseAdmin.from('notifications').insert({
        session_id: sessionId,
        type: 'confirmation',
        channel: 'email',
        sent_at: null,
        status: 'failed',
      });
    }

    // 7. Send magic link to customer email (serves as confirmation)
    try {
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${APP_URL}/session/${sessionId}`,
        },
      });
      // Note: generateLink returns the link but does NOT send the email automatically.
      // The Resend email above already includes the magic link. The OTP signInWithOtp
      // approach would send Supabase's default email — we use our branded Resend email instead.
    } catch (err) {
      console.error('OTP generation note:', err);
      // Non-fatal — branded email already sent via Resend above
    }

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      customer_id: customerId,
      message: 'Check your email for your magic link — click it to access your order',
    });

  } catch (err) {
    console.error('Unexpected booking error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface EmailData {
  firstName: string;
  name: string;
  animalName: string;
  slotType: string;
  butcherDate: string;
  estimatedReady: string;
  hangingWeight: number;
  pricePerLb: number;
  sessionUrl: string;
}

function buildConfirmationEmail(data: EmailData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Legacy Land & Cattle Beef Order</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:Georgia,Cambria,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#2D5016;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">
                Legacy Land & Cattle
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
                Order Confirmed, ${data.firstName}! 🎉
              </h2>
              <p style="margin:0 0 24px;color:#555;font-size:15px;font-family:Arial,sans-serif;line-height:1.6;">
                Your beef order has been successfully reserved. Here&apos;s a summary of what you&apos;ve locked in:
              </p>
              
              <!-- Order Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;border-radius:8px;padding:0;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                      Order Summary
                    </p>
                    ${buildOrderRow('Animal', data.animalName)}
                    ${buildOrderRow('Order Type', data.slotType)}
                    ${buildOrderRow('Butcher Date', data.butcherDate)}
                    ${buildOrderRow('Estimated Ready', data.estimatedReady)}
                    ${buildOrderRow('Hanging Weight', `~${data.hangingWeight} lbs`)}
                    ${buildOrderRow('Price', `$${data.pricePerLb.toFixed(2)}/lb`, true)}
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${data.sessionUrl}"
                       style="display:inline-block;background-color:#2D5016;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:700;font-family:Arial,sans-serif;letter-spacing:0.5px;">
                      View Your Order →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin:0 0 8px;color:#555;font-size:13px;font-family:Arial,sans-serif;line-height:1.5;text-align:center;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0 0 28px;font-size:11px;color:#888;font-family:monospace;text-align:center;word-break:break-all;">
                ${data.sessionUrl}
              </p>
              
              <hr style="border:none;border-top:1px solid #eee;margin-bottom:24px;">
              
              <h3 style="margin:0 0 8px;color:#2D5016;font-size:16px;">What&apos;s Next?</h3>
              <p style="margin:0 0 8px;color:#555;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;">
                1. <strong>Click the button above</strong> to view your order page.
              </p>
              <p style="margin:0 0 8px;color:#555;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;">
                2. <strong>Build your cut sheet</strong> — tell us exactly how you want your beef butchered.
              </p>
              <p style="margin:0;color:#555;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;">
                3. <strong>We&apos;ll handle the rest</strong> — you&apos;ll get updates as we move through the process.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;color:#aaa;font-size:12px;font-family:Arial,sans-serif;">
                Legacy Land & Cattle · legacylandandcattleco.com
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

function buildOrderRow(label: string, value: string, last = false): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:${last ? '0' : '8px'};">
      <tr>
        <td style="font-size:13px;color:#888;font-family:Arial,sans-serif;width:140px;">${label}</td>
        <td style="font-size:14px;color:#222;font-family:Arial,sans-serif;font-weight:600;">${value}</td>
      </tr>
    </table>`;
}
