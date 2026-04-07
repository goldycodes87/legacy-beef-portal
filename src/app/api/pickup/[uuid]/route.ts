export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

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

  const emailBody = `
    <p>You're all set!</p>
    <p><strong>${pickupDate}</strong> from <strong>${window.start_time} – ${window.end_time}</strong></p>
    <p><strong>6105 Burgess Rd, Colorado Springs CO 80908</strong></p>
    ${is_alternate ? `<p>Pickup person: <strong>${pickup_person_name}</strong> (${pickup_person_phone})</p>` : ''}
    <p>Questions? Reply to this email.</p>
  `;

  if (customer) {
    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: customer.email,
      cc: is_alternate ? pickup_person_email : undefined,
      subject: `Pickup confirmed — see you ${new Date(window.pickup_date).toLocaleDateString('en-US', { weekday: 'short' })}! 🥩`,
      html: emailBody,
    });
  }

  return NextResponse.json({ success: true });
}
