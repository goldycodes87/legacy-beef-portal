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
  const preheader = 'Time to come get your beef.';

  const balanceDueContent =
    balanceDue > 0
      ? `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:20px;margin:20px 0;">
      <p style="color:#E85D24;font-weight:700;font-size:16px;margin:0 0 8px;">
        Balance Due: $${balanceDue.toFixed(2)}
      </p>
      <p style="color:#6B7280;font-size:13px;margin:0;">
        Please bring payment to pickup or pay online now.
      </p>
    </div>
    ${ctaButton('Pay Balance Online →', balanceLink)}
  `
      : '';

  const content = `
    <h2 style="font-family:Georgia,serif;color:#1A3D2B;font-size:22px;margin:0 0 8px;">
      Great news, ${firstName} — your beef is ready! 🥩
    </h2>
    <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">
      Your beef is back from the butcher and waiting for you at the ranch. Here's what you need to know:
    </p>

    ${orderCard([
      { label: 'Animal', value: animal.name },
      { label: 'Hanging Weight', value: `${hangingWeight} lbs` },
      { label: 'Price/lb', value: `$${pricePerLb.toFixed(2)}` },
      {
        label: 'Balance Due',
        value:
          balanceDue > 0 ? `$${balanceDue.toFixed(2)}` : 'Paid in Full ✓',
      },
    ])}

    ${balanceDueContent}

    <h3 style="font-family:Georgia,serif;color:#1A3D2B;font-size:18px;margin:20px 0 12px;">How pickup works:</h3>
    <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:14px;line-height:1.8;margin:0;">
      1. Schedule your pickup time using the button below.<br>
      2. Come to 6105 Burgess Rd, Colorado Springs CO 80908.<br>
      3. Bring your remaining balance (cash, check, or pay online above).<br>
      4. We'll load your beef — it'll be packaged, labeled, and frozen solid.
    </p>

    ${ctaButton('Schedule My Pickup →', pickupLink, '#1A3D2B')}
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
