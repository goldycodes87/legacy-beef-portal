export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { emailBase, ctaButton, orderCard } from '@/lib/email-templates';

export async function POST(request: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
  const supabase = getSupabaseAdmin();
  const { uuid } = await params;
  const portalOrigin = request.nextUrl.origin;
  const { pickup_window_id: window_id, is_alternate, pickup_person_name, pickup_person_email, pickup_person_phone, waiver_signed } = await request.json();

  // Create appointment
  const { data: appointment, error } = await supabase
    .from('pickup_appointments')
    .insert({
      session_id: uuid,
      pickup_window_id: window_id,
      is_alternate_pickup: is_alternate,
      pickup_person_name,
      pickup_person_email,
      pickup_person_phone,
      waiver_signed,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send confirmation email
  const { data: session } = await supabase
    .from('sessions')
    .select('id, customers(name, email), animals(name)')
    .eq('id', uuid)
    .single();

  const customer = (Array.isArray(session?.customers) ? session.customers[0] : session?.customers) as { name: string; email: string } | undefined;

  const { data: window } = await supabase
    .from('pickup_windows')
    .select('*')
    .eq('id', window_id)
    .single();

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const pickupDate = new Date(window.pickup_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const dayOfWeek = new Date(window.pickup_date).toLocaleDateString('en-US', { weekday: 'short' });
  const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Beef+Pickup&dates=${new Date(window.pickup_date).toISOString().split('T')[0]}/${new Date(window.pickup_date).toISOString().split('T')[0]}&details=6105%20Burgess%20Rd%2C%20Colorado%20Springs%20CO%2080908`;

  if (customer) {
    const firstName = customer.name?.split(' ')[0] ?? 'there';
    const preheader = `See you ${dayOfWeek}, ${firstName}!`;
    const timeValue = window.start_time + ' – ' + window.end_time;
    const pickupPerson = is_alternate ? pickup_person_name : customer.name;
    const content = `
      <table role="presentation" width="100%" style="border-radius:12px;margin:0 0 28px;"><tr><td bgcolor="#1A3D2B" style="background:linear-gradient(135deg,#1A3D2B 0%,#2d6a4f 100%);border-radius:12px;padding:28px 24px;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">📅</div>
        <h2 style="font-family:Georgia,serif;color:white;font-size:24px;margin:0 0 8px;font-weight:normal;">
          Pickup confirmed, ${firstName}!
        </h2>
        <p style="color:#C4A46B;font-size:14px;margin:0;font-family:Arial,sans-serif;">
          We&apos;ll see you ${dayOfWeek}.
        </p>
      </td></tr></table>
      <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 24px;">
        You&apos;re on the schedule. Here&apos;s everything you need for pickup day:
      </p>
      ${orderCard([
        { label: 'Date', value: pickupDate },
        { label: 'Time', value: timeValue },
        { label: 'Pickup Person', value: pickupPerson },
        { label: 'Address', value: '6105 Burgess Rd, Colorado Springs CO 80908' },
      ])}
      <div style="background:#F9F6F1;border:1px solid #E5E0D8;border-radius:12px;padding:16px 20px;margin:24px 0;">
        <p style="font-family:Arial,sans-serif;font-size:14px;color:#1A3D2B;margin:0 0 8px;font-weight:bold;">
          📦 What to bring
        </p>
        <p style="font-family:Arial,sans-serif;font-size:13px;color:#374151;margin:0;line-height:1.8;">
          &bull; A cooler or two &mdash; we can also help load straight into your vehicle<br>
          &bull; A quarter fills ~2 boxes, a half fills ~4, a whole fills 8&ndash;10<br>
          &bull; Your remaining balance if not paid &mdash; cash, check, or card accepted
        </p>
      </div>
      ${ctaButton('Add to Google Calendar 📅', googleCalendarLink, '#1A3D2B')}
      <p style="color:#9CA3AF;font-size:12px;font-family:Arial,sans-serif;text-align:center;margin-top:8px;">
        Need to reschedule? Call us at (719) 258-1777.
      </p>
    `;

    const htmlEmail = emailBase(content, preheader);

    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: customer.email,
      cc: is_alternate ? pickup_person_email : undefined,
      subject: `Pickup confirmed — see you ${dayOfWeek}! 🥩`,
      html: htmlEmail,
    });

    // Grant notification
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && resendKey !== 're_placeholder_set_in_vercel') {
        const { Resend: ResendGrant } = await import('resend');
        const resendG = new ResendGrant(resendKey);
        const animal = Array.isArray(session?.animals) ? session.animals[0] : session?.animals;
        await resendG.emails.send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: 'orders@legacylandandcattleco.com',
          subject: `Pickup Confirmed — ${customer.name}`,
          html: `
            <ul>
              <li><strong>Customer:</strong> ${customer.name} (${customer.email})</li>
              <li><strong>Order:</strong> ${animal?.name || 'N/A'}</li>
              <li><strong>Pickup Date:</strong> ${pickupDate}</li>
              <li><strong>Pickup Time:</strong> ${timeValue}</li>
            </ul>
          `,
        });
      }
    } catch (grantErr) {
      console.error('Grant notification error:', grantErr);
    }

    try {
      await fetch(`${portalOrigin}/api/notify-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-notify-secret': process.env.ADMIN_NOTIFY_SECRET || '',
        },
        body: JSON.stringify({
          title: '📅 Pickup Scheduled',
          body: `${customer.name} scheduled pickup`,
          url: '/slots',
        }),
      });
    } catch (notifyErr) {
      console.error('Admin notify failed (pickup):', notifyErr);
    }
  }

  return NextResponse.json({ success: true });
}
