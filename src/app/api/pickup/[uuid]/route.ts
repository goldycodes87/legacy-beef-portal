export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { build, pickupConfirmed, PICKUP_ADDRESS } from '@/lib/email-content';
import {
  formatPickupDate,
  formatPickupTimeRange,
  isPickupWindowPast,
  pickupCalendarUrl,
} from '@/lib/pickup';

export async function POST(request: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
  const supabase = getSupabaseAdmin();
  const { uuid } = await params;
  const portalOrigin = request.nextUrl.origin;
  const { pickup_window_id: window_id, is_alternate, pickup_person_name, pickup_person_email, pickup_person_phone, waiver_signed } = await request.json();

  if (is_alternate && (!pickup_person_name?.trim() || !waiver_signed)) {
    return NextResponse.json({ error: 'Add the pickup person’s name and accept the release.' }, { status: 400 });
  }

  const [{ data: session }, { data: window }, { data: existing }] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, status, balance_due, customers(name, email), animals(name)')
      .eq('id', uuid)
      .single(),
    supabase
      .from('pickup_windows')
      .select('*, pickup_appointments(id)')
      .eq('id', window_id)
      .single(),
    supabase.from('pickup_appointments').select('id').eq('session_id', uuid).maybeSingle(),
  ]);

  // The page only lists bookable windows, but it can sit open for days — the
  // window may have filled or passed since, so check again here.
  if (!session || session.status !== 'beef_ready') {
    return NextResponse.json({ error: 'This order is not ready for pickup yet.' }, { status: 400 });
  }
  if (existing) {
    return NextResponse.json({ error: 'Your pickup is already scheduled. Call us to change it.' }, { status: 409 });
  }
  if (
    !window ||
    !window.active ||
    isPickupWindowPast(window) ||
    (window.pickup_appointments || []).length >= (window.max_slots ?? 999)
  ) {
    return NextResponse.json({ error: 'That pickup time is no longer available — please choose another.' }, { status: 409 });
  }

  const { error } = await supabase
    .from('pickup_appointments')
    .insert({
      session_id: uuid,
      pickup_window_id: window_id,
      is_alternate_pickup: is_alternate,
      pickup_person_name,
      pickup_person_email,
      pickup_person_phone,
      waiver_signed,
      waiver_signed_at: waiver_signed ? new Date().toISOString() : null,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send confirmation email
  const customer = (Array.isArray(session.customers) ? session.customers[0] : session.customers) as { name: string; email: string } | undefined;

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const pickupDate = formatPickupDate(window.pickup_date, { weekday: 'long', month: 'long', day: 'numeric' });
  const dayOfWeek = formatPickupDate(window.pickup_date, { weekday: 'long' });
  const googleCalendarLink = pickupCalendarUrl(window, PICKUP_ADDRESS);

  if (customer) {
    const firstName = customer.name?.split(' ')[0] ?? 'there';
    const timeValue = formatPickupTimeRange(window);
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
          to: 'grant@legacylandandcattleco.com',
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
