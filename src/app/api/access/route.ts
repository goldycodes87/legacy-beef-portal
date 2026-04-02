export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const { session_id, email } = await request.json();

  if (!session_id || !email) {
    return NextResponse.json({ error: 'Missing session or email' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Find session and verify email matches
  const { data: session } = await supabase
    .from('sessions')
    .select('id, customer_id, status')
    .eq('id', session_id)
    .not('status', 'eq', 'cancelled')
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('email')
    .eq('id', session.customer_id)
    .single();

  if (!customer || customer.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: "That email doesn't match our records for this order." }, { status: 401 });
  }

  // Email matches — set access cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set('order_access', session_id, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 90, // 90 days
    path: '/',
  });
  return response;
}
