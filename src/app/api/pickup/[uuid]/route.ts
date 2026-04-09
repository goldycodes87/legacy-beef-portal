export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { emailBase, ctaButton, orderCard } from '@/lib/email-templates';

export async function POST(request: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
  const supabase = getSupabaseAdmin();
  const { uuid } = await params;
  const { window_id, is_alternate, pickup_person_name, pickup_person_email, pickup_person_phone, waiver_signed } = await request.json();

  // Create appointment
  const { data: appointment, error } = await supabase
    .from('pickup_appointments')
    .insert({
      session_id: uuid,
      window_id,
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
    const preheader = 'Your pickup time is locked in.';
    const content = `
      <h2 style="font-family:Georgia,serif;color:#0F0F0F;font-size:22px;margin:0 0 8px;">
        You're all set, ${firstName}!
      </h2>
      <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">
        Your pickup is confirmed. Here's what you need:
      </p>

      ${orderCard([
        { label: 'Date', value: pickupDate },
        { label: 'Time', value: `${window.start_time} – ${window.end_time}` },
        { label: 'Pickup Person', value: is_alternate ? pickup_person_name : customer.name },
        { label: 'Address', value: '6105 Burgess Rd, Colorado Springs CO 80908' },
      ])}

      <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">
        <strong style="color:#0F0F0F;">What to bring:</strong> Your remaining balance if not already paid
        (cash, check, or card). We'll have everything packaged and ready.
      </p>

      ${ctaButton('Add to Google Calendar 📅', googleCalendarLink, '#1A3D2B')}
    `;

    const htmlEmail = emailBase(content, preheader);

    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: customer.email,
      cc: is_alternate ? pickup_person_email : undefined,
      subject: `Pickup confirmed — see you ${dayOfWeek}! 🥩`,
      html: htmlEmail,
    });
  }

  return NextResponse.json({ success: true });
}
