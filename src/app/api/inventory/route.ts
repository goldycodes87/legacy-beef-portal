export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const animalType = searchParams.get('animalType') || 'no_preference';

  let query = supabaseAdmin
    .from('animals')
    .select('total_animals, units_used')
    .eq('status', 'available');

  if (animalType !== 'no_preference') {
    query = query.eq('animal_type', animalType);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return NextResponse.json({
      whole_available: 0,
      half_available: 0,
      quarter_available: 0,
    });
  }

  // Sum remaining capacity across all matching animals
  const totalRemaining = data.reduce((sum, animal) => {
    return sum + ((animal.total_animals || 1) - (animal.units_used || 0));
  }, 0);

  return NextResponse.json({
    whole_available: Math.floor(totalRemaining / 1.0),
    half_available: Math.floor(totalRemaining / 0.5),
    quarter_available: Math.floor(totalRemaining / 0.25),
  });
}
