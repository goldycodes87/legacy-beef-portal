import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data: slots, error } = await supabaseAdmin
      .from('butcher_slots')
      .select(`
        *,
        animal:animals(*)
      `)
      .eq('status', 'available')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching slots:', error);
      return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
    }

    return NextResponse.json({ slots: slots || [] });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
