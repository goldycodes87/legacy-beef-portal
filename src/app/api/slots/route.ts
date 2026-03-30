import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Compute spots remaining based on purchaseType
function computeSpotsRemaining(
  animal: Record<string, number>,
  purchaseType: string
): number {
  switch (purchaseType) {
    case 'whole':
      return Math.max(0, (animal.slots_whole || 0) - (animal.slots_whole_used || 0));
    case 'half':
      return Math.max(0, (animal.slots_half || 0) - (animal.slots_half_used || 0));
    case 'quarter':
      return Math.max(0, (animal.slots_quarter || 0) - (animal.slots_quarter_used || 0));
    default:
      // fallback: use the largest available pool
      return Math.max(
        0,
        (animal.slots_whole || 0) - (animal.slots_whole_used || 0),
        (animal.slots_half || 0) - (animal.slots_half_used || 0),
        (animal.slots_quarter || 0) - (animal.slots_quarter_used || 0)
      );
  }
}

// Deposit amounts by size
function depositAmount(purchaseType: string): number {
  switch (purchaseType) {
    case 'whole':   return 250;
    case 'half':    return 150;
    case 'quarter': return 100;
    default:        return 150;
  }
}

// Estimated total range based on finished cut weights
function estimatedTotalRange(purchaseType: string, pricePerLb: number): { low: number; high: number } {
  // Base finished cut range for whole beef: 390–465 lbs
  const wholeWeightLow  = 390;
  const wholeWeightHigh = 465;
  let divisor = 1;
  if (purchaseType === 'half')    divisor = 2;
  if (purchaseType === 'quarter') divisor = 4;

  return {
    low:  Math.round((wholeWeightLow  / divisor) * pricePerLb),
    high: Math.round((wholeWeightHigh / divisor) * pricePerLb),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const animalType   = searchParams.get('animalType')   || 'no_preference';
  const purchaseType = searchParams.get('purchaseType') || 'half';

  try {
    let query = supabaseAdmin
      .from('animals')
      .select('*')
      .eq('status', 'available')
      .order('butcher_date', { ascending: true });

    // Filter by animal type unless user has no preference
    if (animalType && animalType !== 'no_preference') {
      query = query.eq('animal_type', animalType);
    }

    const { data: animals, error } = await query;

    if (error) {
      console.error('Error fetching animals:', error);
      return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
    }

    // Filter to only animals with spots remaining for the requested purchase type,
    // then enrich with derived fields
    const slots = (animals || [])
      .map((animal) => {
        const spotsRemaining = computeSpotsRemaining(animal, purchaseType);
        const estRange = estimatedTotalRange(purchaseType, Number(animal.price_per_lb));
        return {
          id:                    animal.id,
          name:                  animal.name,
          animal_type:           animal.animal_type,
          butcher_date:          animal.butcher_date,
          estimated_ready_date:  animal.estimated_ready_date,
          price_per_lb:          Number(animal.price_per_lb),
          hanging_weight_lbs:    animal.hanging_weight_lbs,
          slots_whole:           animal.slots_whole,
          slots_whole_used:      animal.slots_whole_used,
          slots_half:            animal.slots_half,
          slots_half_used:       animal.slots_half_used,
          slots_quarter:         animal.slots_quarter,
          slots_quarter_used:    animal.slots_quarter_used,
          spots_remaining:       spotsRemaining,
          deposit_amount:        depositAmount(purchaseType),
          est_total_low:         estRange.low,
          est_total_high:        estRange.high,
          purchase_type:         purchaseType,
        };
      })
      .filter((s) => s.spots_remaining > 0);

    return NextResponse.json({ slots });
  } catch (err) {
    console.error('Unexpected error in /api/slots:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
