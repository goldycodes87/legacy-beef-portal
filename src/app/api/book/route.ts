import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
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

function purchaseTypeLabel(type: string) {
  switch (type) {
    case 'whole':   return 'Whole Beef';
    case 'half':    return 'Half Beef';
    case 'quarter': return 'Quarter Beef';
    default:        return type;
  }
}

function depositAmount(purchaseType: string): number {
  switch (purchaseType) {
    case 'whole':   return 850;
    case 'half':    return 500;
    case 'quarter': return 250;
    default:        return 500;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, animal_id, purchase_type } = body;

    // Validate required fields
    if (!name || !email || !phone || !address || !animal_id || !purchase_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify the animal is still available with spots remaining
    const { data: animal, error: animalError } = await supabaseAdmin
      .from('animals')
      .select('*')
      .eq('id', animal_id)
      .eq('status', 'available')
      .single();

    if (animalError || !animal) {
      return NextResponse.json({
        error: 'This animal is no longer available. Please go back and select another.',
      }, { status: 409 });
    }

    // Compute spots remaining for this purchase type
    let spotsRemaining = 0;
    let usedColumn = '';
    switch (purchase_type) {
      case 'whole':
        spotsRemaining = Math.max(0, (animal.slots_whole || 0) - (animal.slots_whole_used || 0));
        usedColumn = 'slots_whole_used';
        break;
      case 'half':
        spotsRemaining = Math.max(0, (animal.slots_half || 0) - (animal.slots_half_used || 0));
        usedColumn = 'slots_half_used';
        break;
      case 'quarter':
        spotsRemaining = Math.max(0, (animal.slots_quarter || 0) - (animal.slots_quarter_used || 0));
        usedColumn = 'slots_quarter_used';
        break;
      default:
        return NextResponse.json({ error: 'Invalid purchase type' }, { status: 400 });
    }

    if (spotsRemaining <= 0) {
      return NextResponse.json({
        error: 'No spots remaining for this selection. Please go back and choose another.',
      }, { status: 409 });
    }

    // 2. Upsert customer (match on email)
    let customerId: string;
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingCustomer) {
      await supabaseAdmin
        .from('customers')
        .update({ name, phone, address })
        .eq('id', existingCustomer.id);
      customerId = existingCustomer.id;
    } else {
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

    // 3. Create session record (slot_id is nullable per block7 migration)
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        customer_id:     customerId,
        animal_id:       animal_id,
        purchase_type:   purchase_type,
        status:          'draft',
        partner_approved: false,
        owner_approved:   false,
        last_saved:       new Date().toISOString(),
      })
      .select('id')
      .single();

    if (sessionError || !sessionData) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    const sessionId = sessionData.id;

    // 4. Increment slots_used on the animal (optimistic — race condition handled by check above)
    const { error: updateError } = await supabaseAdmin
      .from('animals')
      .update({ [usedColumn]: (animal[usedColumn] || 0) + 1 })
      .eq('id', animal_id);

    if (updateError) {
      console.error('Error updating animal slots_used:', updateError);
      // Non-fatal — log but continue
    }

    // 5. Build session URL
    const sessionUrl = `${APP_URL}/session/${sessionId}`;

    // 6. Send confirmation email via Resend
    const firstName = name.split(' ')[0];
    const deposit = depositAmount(purchase_type);

    try {
      await resend.emails.send({
        from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
        to: email,
        subject: 'Your Legacy Land & Cattle beef order is confirmed',
        html: buildConfirmationEmail({
          firstName,
          name,
          animalName:     animal.name,
          purchaseType:   purchaseTypeLabel(purchase_type),
          butcherDate:    animal.butcher_date ? formatDate(animal.butcher_date) : 'TBD',
          estimatedReady: animal.estimated_ready_date ? formatDate(animal.estimated_ready_date) : 'TBD',
          hangingWeight:  animal.hanging_weight_lbs,
          pricePerLb:     Number(animal.price_per_lb),
          deposit,
          sessionUrl,
        }),
      });

      await supabaseAdmin.from('notifications').insert({
        session_id: sessionId,
        type:       'confirmation',
        channel:    'email',
        sent_at:    new Date().toISOString(),
        status:     'sent',
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      await supabaseAdmin.from('notifications').insert({
        session_id: sessionId,
        type:       'confirmation',
        channel:    'email',
        sent_at:    null,
        status:     'failed',
      });
    }

    return NextResponse.json({
      success:     true,
      session_id:  sessionId,
      customer_id: customerId,
      message:     'Booking confirmed! Check your email for details.',
    });
  } catch (err) {
    console.error('Unexpected booking error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Email builder ────────────────────────────────────────────────────────────

interface EmailData {
  firstName:     string;
  name:          string;
  animalName:    string;
  purchaseType:  string;
  butcherDate:   string;
  estimatedReady: string;
  hangingWeight: number;
  pricePerLb:    number;
  deposit:       number;
  sessionUrl:    string;
}

function buildConfirmationEmail(data: EmailData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Legacy Land &amp; Cattle Beef Order</title>
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
                Order Confirmed, ${data.firstName}! &#x1F389;
              </h2>
              <p style="margin:0 0 24px;color:#555;font-size:15px;font-family:Arial,sans-serif;line-height:1.6;">
                Your beef order has been successfully reserved. Here&apos;s a summary of what you&apos;ve locked in:
              </p>

              <!-- Order Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                      Order Summary
                    </p>
                    ${buildRow('Animal', data.animalName)}
                    ${buildRow('Order Type', data.purchaseType)}
                    ${buildRow('Butcher Date', data.butcherDate)}
                    ${buildRow('Estimated Ready', data.estimatedReady)}
                    ${data.hangingWeight ? buildRow('Hanging Weight', `~${data.hangingWeight} lbs`) : ''}
                    ${buildRow('Price Per Lb', `$${data.pricePerLb.toFixed(2)}/lb`)}
                    ${buildRow('Deposit Due', `$${data.deposit.toLocaleString()}`, true)}
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${data.sessionUrl}"
                       style="display:inline-block;background-color:#2D5016;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:700;font-family:Arial,sans-serif;letter-spacing:0.5px;">
                      View Your Order &rarr;
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

              <h3 style="margin:0 0 12px;color:#2D5016;font-size:16px;">What&apos;s Next?</h3>
              <p style="margin:0 0 8px;color:#555;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;">
                1. <strong>Deposit</strong> — A $${data.deposit.toLocaleString()} deposit secures your slot. We&apos;ll reach out with payment details.
              </p>
              <p style="margin:0 0 8px;color:#555;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;">
                2. <strong>Cut Sheet</strong> — Build your custom cut sheet so the butcher knows exactly how you want your beef.
              </p>
              <p style="margin:0;color:#555;font-size:14px;font-family:Arial,sans-serif;line-height:1.6;">
                3. <strong>Pickup</strong> — Once your beef is ready, we&apos;ll notify you to schedule pickup or delivery.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;color:#aaa;font-size:12px;font-family:Arial,sans-serif;">
                Legacy Land &amp; Cattle &middot; legacylandandcattleco.com
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

function buildRow(label: string, value: string, last = false): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:${last ? '0' : '8px'};">
    <tr>
      <td style="font-size:13px;color:#888;font-family:Arial,sans-serif;width:140px;">${label}</td>
      <td style="font-size:14px;color:#222;font-family:Arial,sans-serif;font-weight:600;">${value}</td>
    </tr>
  </table>`;
}
