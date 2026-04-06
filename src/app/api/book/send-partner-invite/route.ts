export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { session_id } = await request.json();

  // Load session + owner + animal
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select(`
      id, group_id, animal_id, purchase_type, group_size, invite_expires_at, partner_emails,
      customers (id, name, email),
      animals (id, name, butcher_date)
    `)
    .eq('id', session_id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const owner = session.customers as unknown as { id: string; name: string; email: string };
  const animal = session.animals as unknown as { id: string; name: string; butcher_date: string };
  const depositMap: Record<string, number> = { whole: 500, half: 250, quarter: 250 };
  const depositAmount = depositMap[session.purchase_type] || 250;
  const purchaseLabel = session.purchase_type.charAt(0).toUpperCase() + session.purchase_type.slice(1);

  // Send invitation email to each partner
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  for (const partnerEmail of (session.partner_emails as string[]) || []) {
    const expiryTime = new Date(session.invite_expires_at).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Denver'
    });

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f0e8; margin: 0; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    
    <!-- Header -->
    <tr>
      <td style="background-color: #2D5016; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Legacy Land &amp; Cattle</h1>
        <p style="color: #C4A46B; margin: 5px 0 0; font-size: 12px; letter-spacing: 2px;">GRASS-FED BEEF</p>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 30px;">
        <h2 style="color: #2D5016; margin-top: 0;">Hey! ${owner.name?.split(' ')[0] || 'friend'}</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          ${owner.name} reserved you a spot for <strong>${purchaseLabel}</strong> of grass-fed beef from Legacy Land &amp; Cattle and added you as a partner.
        </p>

        <!-- Reservation Details -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
          <tr>
            <td style="padding: 16px;">
              <p style="margin: 0 0 10px; color: #666; font-size: 14px;"><strong>Animal:</strong> ${animal.name}</p>
              <p style="margin: 0 0 10px; color: #666; font-size: 14px;"><strong>Butcher Date:</strong> ${new Date(animal.butcher_date).toLocaleDateString()}</p>
              <p style="margin: 0; color: #2D5016; font-size: 16px; font-weight: bold;"><strong>Your Deposit:</strong> $${depositAmount}</p>
            </td>
          </tr>
        </table>

        <p style="color: #d97706; font-weight: bold; font-size: 16px;">⏰ You have 48 hours to claim your spot (expires ${expiryTime} MT)</p>

        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <a href="${APP_URL}/join/${session.group_id}" style="background-color: #E85D24; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                Claim My Spot →
              </a>
            </td>
          </tr>
        </table>

        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          Questions? Reply to this email or contact us at orders@legacylandandcattleco.com
        </p>
      </td>
    </tr>

  </table>
</body>
</html>
    `;

    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: partnerEmail,
      subject: `${owner.name?.split(' ')[0]} reserved you a spot for beef — claim it before it expires`,
      html: htmlBody,
    }).catch(err => console.error('Resend error:', err));
  }

  return NextResponse.json({ success: true });
}
