export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id, purchase_type, status, price_per_lb, is_splitting, group_role, group_id, group_size, created_at,
      customers (id, name, email),
      animals (id, name, butcher_date)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // For split owners, check if a partner has claimed a spot
  const enriched = await Promise.all(
    (sessions || []).map(async (session) => {
      let partner_confirmed = false;
      if (session.is_splitting && session.group_role === 'owner' && session.group_id) {
        const { data: partnerSessions } = await supabase
          .from('sessions')
          .select('id')
          .eq('group_id', session.group_id)
          .eq('group_role', 'partner')
          .neq('status', 'cancelled');
        partner_confirmed = (partnerSessions?.length || 0) > 0;
      }
      return {
        ...session,
        partner_confirmed,
      };
    })
  );

  return NextResponse.json({ sessions: enriched });
}
