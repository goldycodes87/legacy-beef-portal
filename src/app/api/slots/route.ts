export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getConfig, getPricePerLb, getDepositAmount } from '@/lib/config';

// Compute spots remaining based on purchaseType
function computeSpotsRemaining(animal: any, purchaseType: string): number {
  const remaining = (animal.total_animals || 1) - (animal.units_used || 0);
  switch (purchaseType) {
    case 'whole': return Math.floor(remaining / 1.0);
    case 'half': return Math.floor(remaining / 0.5);
    case 'quarter': return Math.floor(remaining / 0.25);
    default: return 0;
  }
}

// Estimated total range based on hanging weight ranges (rounded to nearest $50)
function estimatedTotalRange(purchaseType: string, pricePerLb: number): { low: number; high: number } {
  // Hanging weight ranges per size:
  //   Whole:   650–775 lbs
  //   Half:    325–390 lbs
  //   Quarter: 163–195 lbs
  let weightLow: number;
  let weightHigh: number;

  switch (purchaseType) {
    case 'whole':
      weightLow = 650; weightHigh = 775; break;
    case 'half':
      weightLow = 325; weightHigh = 390; break;
    case 'quarter':
      weightLow = 163; weightHigh = 195; break;
    default:
      weightLow = 325; weightHigh = 390;
  }

  // Round to nearest $50 for clean display
  const roundTo50 = (n: number) => Math.round(n / 50) * 50;
  return {
    low:  roundTo50(weightLow  * pricePerLb),
    high: roundTo50(weightHigh * pricePerLb),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const animalType   = searchParams.get('animalType')   || 'no_preference';
  const purchaseType = searchParams.get('purchaseType') || 'half';

  try {
    // Fetch animals, deposit config, and price config in parallel
    let query = supabaseAdmin
      .from('animals')
      .select('id, name, animal_type, butcher_date, estimated_ready_date, status, price_per_lb, hanging_weight_lbs, total_animals, units_used, wagyu_active')
      .eq('status', 'available')
      .order('butcher_date', { ascending: true });

    // Filter by animal type unless user has no preference
    if (animalType && animalType !== 'no_preference') {
      query = query.eq('animal_type', animalType);
    }

    const [{ data: animals, error }, config] = await Promise.all([
      query,
      getConfig(),
    ]);

    if (error) {
      console.error('Error fetching animals:', error);
      return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
    }

    // Filter to only animals with spots remaining for the requested purchase type,
    // then enrich with derived fields
    const slots = (animals || [])
      .map((animal) => {
        const spotsRemaining = computeSpotsRemaining(animal, purchaseType);
        // Use per-size price from config (with fallback), not animal-level price
        const pricePerLb = getPricePerLb(config, purchaseType, animal.animal_type);
        const estRange = estimatedTotalRange(purchaseType, pricePerLb);
        return {
          id:                    animal.id,
          name:                  animal.name,
          animal_type:           animal.animal_type,
          butcher_date:          animal.butcher_date,
          estimated_ready_date:  animal.estimated_ready_date,
          price_per_lb:          pricePerLb,
          hanging_weight_lbs:    animal.hanging_weight_lbs,
          spots_remaining:       spotsRemaining,
          deposit_amount:        getDepositAmount(config, purchaseType, false, animal.animal_type),
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
