export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const supabase = getSupabaseAdmin();
  const { uuid } = await params;
  const { method } = await request.json();

  const allowed = ['card', 'check', 'cash', 'echeck'];
  const safeMethod = allowed.includes(method) ? method : 'card';

  await supabase.from('sessions')
    .update({ intended_payment_method: safeMethod })
    .eq('id', uuid);

  return NextResponse.json({ success: true });
}
