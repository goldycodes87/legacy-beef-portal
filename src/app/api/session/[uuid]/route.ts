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

  // Never expose the magic-link token or the signing record to the browser —
  // the token grants access to this order for 60 days.
  const {
    access_token: _accessToken,
    access_token_expires_at: _accessTokenExpiry,
    contract_signature: _contractSignature,
    contract_ip: _contractIp,
    ...safeSession
  } = session as Record<string, unknown>;

  return NextResponse.json({
    ...safeSession,
    customer: customer || null,
    animal: animal || null,
    pickup_appointment: pickup_appointment || null,
  });
}
