import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // Read animalTypePreference from query param (passed from client-side sessionStorage)
    const { searchParams } = new URL(request.url);
    const animalType = searchParams.get('animalType') || 'no_preference';

    // Determine which row(s) to query
    // If user has no preference or unknown type, fall back to 'all'
    const preferenceKey =
      ['grass_fed', 'grain_finished', 'wagyu'].includes(animalType)
        ? animalType
        : 'all';

    const { data, error } = await supabaseAdmin
      .from('slot_inventory')
      .select('slots_whole, slots_whole_used, slots_half, slots_half_used, slots_quarter, slots_quarter_used')
      .eq('animal_type', preferenceKey)
      .single();

    if (error || !data) {
      // Fallback: query the 'all' row
      const { data: fallback, error: fallbackError } = await supabaseAdmin
        .from('slot_inventory')
        .select('slots_whole, slots_whole_used, slots_half, slots_half_used, slots_quarter, slots_quarter_used')
        .eq('animal_type', 'all')
        .single();

      if (fallbackError || !fallback) {
        // If table doesn't exist yet, return generous defaults so the page still renders
        return NextResponse.json({
          whole_available: 5,
          half_available: 10,
          quarter_available: 8,
        });
      }

      return NextResponse.json({
        whole_available: Math.max(0, fallback.slots_whole - fallback.slots_whole_used),
        half_available: Math.max(0, fallback.slots_half - fallback.slots_half_used),
        quarter_available: Math.max(0, fallback.slots_quarter - fallback.slots_quarter_used),
      });
    }

    return NextResponse.json({
      whole_available: Math.max(0, data.slots_whole - data.slots_whole_used),
      half_available: Math.max(0, data.slots_half - data.slots_half_used),
      quarter_available: Math.max(0, data.slots_quarter - data.slots_quarter_used),
    });
  } catch (err) {
    console.error('Inventory API error:', err);
    // Safe fallback — never break the page
    return NextResponse.json({
      whole_available: 5,
      half_available: 10,
      quarter_available: 8,
    });
  }
}
