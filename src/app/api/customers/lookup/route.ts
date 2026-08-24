export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * Tells the funnel whether an email belongs to an existing customer.
 *
 * Deliberately returns no personal data. Anyone can guess an email address, so
 * an endpoint that returned name/phone/address here would let a stranger
 * harvest customer details in bulk. Returning customers re-enter their address
 * on the booking form; restoring prefill requires verifying the email first
 * (magic link or one-time code).
 */
export async function POST(request: NextRequest) {
  let email: string | null = null;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ known: false });
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('customers')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .is('archived_at', null)
    .maybeSingle();

  return NextResponse.json({ known: !!data });
}
