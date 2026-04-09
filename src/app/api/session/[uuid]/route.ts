export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .select('*')
    .eq('id', uuid)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
  }

  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('id', session.customer_id)
    .single();

  const { data: animal } = await supabaseAdmin
    .from('animals')
    .select('*')
    .eq('id', session.animal_id)
    .single();

  const { data: pickup_appointment } = await supabaseAdmin
    .from('pickup_appointments')
    .select('*')
    .eq('session_id', uuid)
    .single();

  return NextResponse.json({
    ...session,
    customer: customer || null,
    animal: animal || null,
    pickup_appointment: pickup_appointment || null,
  });
}
