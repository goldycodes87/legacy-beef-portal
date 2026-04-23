export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json({ customer: null });

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('customers')
    .select('id, name, email, phone, address, city, state, zip')
    .eq('email', email.toLowerCase().trim())
    .is('archived_at', null)
    .single();

  return NextResponse.json({ customer: data || null });
}
