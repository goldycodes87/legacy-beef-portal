export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();

  const { data: windows } = await supabase
    .from('pickup_windows')
    .select(`
      id, label, pickup_date, start_time, end_time, max_slots,
      pickup_appointments(id)
    `)
    .eq('active', true)
    .order('pickup_date', { ascending: true })
    .order('start_time', { ascending: true });

  const withCounts = (windows || []).map((w: any) => ({
    ...w,
    appointment_count: (w.pickup_appointments || []).length,
    pickup_appointments: undefined,
  }));

  return NextResponse.json(withCounts);
}
