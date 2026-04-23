export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { emailBase, ctaButton, orderCard } from '@/lib/email-templates';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const supabase = getSupabaseAdmin();

  // Load session + customer + animal
  const { data: session, error: sessionError } = await supabase
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
      ),
      animals (
        id,
        name,
        butcher_date,
        hanging_weight_lbs,
        price_per_lb
      )
    `)
    .eq('id', uuid)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const customer = Array.isArray(
    (session as unknown as { customers: any }).customers
  )
    ? ((session as unknown as { customers: any }).customers[0] ?? null)
    : ((session as unknown as { customers: any }).customers ?? null);

  const animal = Array.isArray(
    (session as unknown as { animals: any }).animals
  )
    ? ((session as unknown as { animals: any }).animals[0] ?? null)
    : ((session as unknown as { animals: any }).animals ?? null);

  if (!customer || !animal) {
    return NextResponse.json(
      { error: 'Missing customer or animal data' },
      { status: 400 }
    );
  }

  // Update session status to ready
  await supabase
    .from('sessions')
    .update({ status: 'ready_for_pickup' })
    .eq('id', uuid);

  // Calculate balance due (total price - deposit)
  // For now, assuming deposit was recorded; retrieve it
  const { data: payments } = await supabase
    .from('payments')
    .select('amount_cents')
    .eq('session_id', uuid)
    .eq('type', 'deposit');

  const depositPaid = payments?.[0]?.amount_cents ?? 0;
  const hangingWeight = parseFloat(animal.hanging_weight_lbs) || 0;
  const pricePerLb = parseFloat(animal.price_per_lb) || 0;
  const totalCost = hangingWeight * pricePerLb;
  const balanceDue = Math.max(0, totalCost - depositPaid / 100);

  // Generate balance payment link (stub)
  const balanceLink = `${APP_URL}/pay-balance/${uuid}`;
  const pickupLink = `${APP_URL}/schedule-pickup/${uuid}`;

  const firstName = customer.name?.split(' ')[0] ?? 'there';
  const firstName = customer.name?.split(' ')[0] ?? 'there';
  const preheader = `${firstName}, your beef is ready. Time to celebrate.`;
  const accessToken = (session as any)?.access_token;
  const pickupLink = accessToken
    ? `${APP_URL}/access/${accessToken}`
    : `${APP_URL}/session/${uuid}/pickup`;

  const balancePaidContent = balanceDue <= 0
    ? `
      <div style="background:#F0F7E8;border:1px solid #c3dfa0;
        border-radius:12px;padding:16px 20px;margin:0 0 24px;
        text-align:center;">
        <p style="font-family:Arial,sans-serif;font-size:15px;
          color:#1A3D2B;margin:0;font-weight:bold;">
          ✅ You're all paid up — just show up and we'll load you out!
        </p>
      </div>
    `
    : `
      <div style="background:#fff7ed;border:1px solid #fed7aa;
        border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="color:#E85D24;font-weight:700;font-size:16px;
          margin:0 0 6px;font-family:Arial,sans-serif;">
          Balance Due: $${balanceDue.toFixed(2)}
        </p>
        <p style="color:#6B7280;font-size:13px;margin:0;
          font-family:Arial,sans-serif;">
          Pay online now or bring cash, check, or card to pickup.
        </p>
      </div>
      <table role="presentation" style="width:100%;margin:0 0 24px;">
        <tr><td style="padding:0 0 10px;">
          <a href="${balanceLink}"
            style="display:block;background:#E85D24;color:white;
              text-align:center;padding:14px 24px;border-radius:10px;
              font-family:Arial,sans-serif;font-size:15px;
              font-weight:bold;text-decoration:none;">
            Pay My Balance Now →
          </a>
        </td></tr>
        <tr><td>
          <a href="${pickupLink}"
            style="display:block;background:#F5F0E8;color:#1A3D2B;
              text-align:center;padding:14px 24px;border-radius:10px;
              font-family:Arial,sans-serif;font-size:15px;
              font-weight:bold;text-decoration:none;
              border:2px solid #1A3D2B;">
            I'll Pay at Pickup
          </a>
        </td></tr>
      </table>
    `;

  const content = `
    <div style="background:linear-gradient(135deg,#1A3D2B 0%,
      #2d6a4f 100%);border-radius:12px;padding:28px 24px;
      text-align:center;margin:0 0 28px;">
      <div style="font-size:48px;margin-bottom:8px;">🥩</div>
      <h2 style="font-family:Georgia,serif;color:white;
        font-size:26px;margin:0 0 8px;font-weight:normal;">
        Your beef is ready, ${firstName}!
      </h2>
      <p style="color:#C4A46B;font-size:14px;margin:0;
        font-family:Arial,sans-serif;letter-spacing:0.5px;">
        Cut, vacuum-sealed, labeled, and waiting for you.
      </p>
    </div>
    <p style="color:#374151;font-family:Arial,sans-serif;
      font-size:15px;line-height:1.7;margin:0 0 24px;">
      It's here. Your beef has been cut to your specifications, 
      vacuum-sealed, and labeled. Every package is frozen solid 
      and ready to load into your vehicle. This is the moment 
      you've been waiting for.
    </p>
    ${orderCard([
      { label: 'Hanging Weight', value: `${hangingWeight} lbs` },
      { label: 'Price Per Lb', value: `$${pricePerLb.toFixed(2)}/lb` },
      { label: 'Total Cost', value: `$${totalCost.toFixed(2)}` },
      { label: 'Deposit Paid', value: `-$${(depositPaid/100).toFixed(2)}` },
      { label: 'Balance Due', value: balanceDue > 0 ? `$${balanceDue.toFixed(2)}` : 'Paid in Full ✓' },
    ])}
    ${balancePaidContent}
    <div style="background:#F9F6F1;border:1px solid #E5E0D8;
      border-radius:12px;padding:16px 20px;margin:0 0 24px;">
      <p style="font-family:Arial,sans-serif;font-size:14px;
        color:#1A3D2B;margin:0 0 6px;font-weight:bold;">
        📦 What to bring
      </p>
      <p style="font-family:Arial,sans-serif;font-size:13px;
        color:#374151;margin:0;line-height:1.8;">
        • A cooler or two (we can help load straight into your vehicle)<br>
        • A quarter beef fills ~2 boxes, a half fills ~4, a whole fills 8–10<br>
        ${balanceDue > 0 ? '• Your remaining balance — cash, check, or card accepted' : '• You're all paid up — nothing to bring but yourself'}
      </p>
    </div>
    ${ctaButton('Schedule My Pickup →', pickupLink, '#1A3D2B')}
    <p style="color:#9CA3AF;font-size:12px;font-family:Arial,
      sans-serif;text-align:center;margin-top:8px;">
      Questions? Call us at (719) 258-1777 or reply to this email.
    </p>
  `;

  const htmlEmail = emailBase(content, preheader);

  // Send email
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: customer.email,
      subject: 'Your beef is ready for pickup! 🎉',
      html: htmlEmail,
    });

    await supabase.from('notifications').insert({
      session_id: uuid,
      type: 'beef_ready',
      channel: 'email',
      sent_at: new Date().toISOString(),
      status: 'sent',
    });
  } catch (err) {
    console.error('Email send error:', err);
  }

  return NextResponse.json({
    success: true,
    session_id: uuid,
    message: 'Session marked ready and notification sent.',
  });
}
