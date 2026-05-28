export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const { session_id } = await request.json();
  if (!session_id) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .select('amount_cents, paid_at')
    .eq('session_id', session_id)
    .eq('type', 'deposit')
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching latest deposit:', error);
    return NextResponse.json({ error: 'Failed to load deposit' }, { status: 500 });
  }

  return NextResponse.json({
    amount_cents: payment?.amount_cents ?? null,
  });
}
