export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { build, pickupConfirmed } from '@/lib/email-content';

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
    .select('id, balance_due, customers(name, email), animals(name)')
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
    const timeValue = window.start_time + ' – ' + window.end_time;
    const pickupPerson = is_alternate ? pickup_person_name : customer.name;
    const { subject, html } = build(pickupConfirmed, {
      firstName,
      dayOfWeek,
      pickupDate,
      pickupTime: timeValue,
      pickupPerson,
      balanceDue: Number(session?.balance_due) || 0,
      calendarUrl: googleCalendarLink,
    });


    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: customer.email,
      cc: is_alternate ? pickup_person_email : undefined,
      subject,
      html,
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
