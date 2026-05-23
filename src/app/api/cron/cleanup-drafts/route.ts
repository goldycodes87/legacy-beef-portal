export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Find expired draft sessions
  const { data: expiredDrafts } = await supabase
    .from('sessions')
    .select('id, animal_id, purchase_type, intended_payment_method')
    .eq('status', 'draft')
    .lt('created_at', cutoff)
    .not('intended_payment_method', 'in', '(check,cash)');

  if (!expiredDrafts || expiredDrafts.length === 0) {
    return NextResponse.json({ cancelled: 0 });
  }

  let cancelled = 0;
  for (const session of expiredDrafts) {
    // Decrement units_used
    const unitCost = session.purchase_type === 'whole' ? 1.0 : session.purchase_type === 'half' ? 0.5 : 0.25;
    const { data: animal } = await supabase
      .from('animals')
      .select('units_used')
      .eq('id', session.animal_id)
      .single();
    if (animal) {
      await supabase.from('animals')
        .update({ units_used: Math.max(0, (animal.units_used || 0) - unitCost) })
        .eq('id', session.animal_id);
    }
    // Cancel the session
    await supabase.from('sessions')
      .update({ status: 'cancelled' })
      .eq('id', session.id);
    cancelled++;
  }

  return NextResponse.json({ cancelled });
}
