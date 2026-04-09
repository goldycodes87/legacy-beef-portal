export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const supabase = getSupabaseAdmin();
  await supabase.from('sessions').update({
    balance_payment_method: 'cash',
    balance_paid: true,
    balance_paid_at: new Date().toISOString(),
  }).eq('id', uuid);
  return NextResponse.json({ success: true });
}
