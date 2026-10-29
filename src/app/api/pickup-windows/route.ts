export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isPickupWindowPast, ranchNow } from '@/lib/pickup';

/** Only windows a customer can actually book: active, not over, not full. */
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();

  const { data: windows } = await supabase
    .from('pickup_windows')
    .select(`
      id, label, pickup_date, start_time, end_time, max_slots,
      pickup_appointments(id)
    `)
    .eq('active', true)
    .gte('pickup_date', ranchNow().date)
    .order('pickup_date', { ascending: true })
    .order('start_time', { ascending: true });

  const bookable = (windows || [])
    .map((w: any) => ({
      ...w,
      appointment_count: (w.pickup_appointments || []).length,
      pickup_appointments: undefined,
    }))
    .filter((w: any) => !isPickupWindowPast(w) && w.appointment_count < (w.max_slots ?? 999));

  return NextResponse.json(bookable);
}
