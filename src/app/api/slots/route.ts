import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

// Fetch deposit amounts from the config table
async function fetchDepositAmounts(): Promise<Record<string, number>> {
  const { data, error } = await supabaseAdmin
    .from('config')
    .select('key, value')
    .in('key', ['deposit_half', 'deposit_whole_single', 'deposit_whole_split', 'deposit_quarter']);

  if (error || !data) {
    console.error('Error fetching deposit config:', error);
    // Fallback to known values if config fetch fails
    return {
      deposit_half: 500,
      deposit_whole_single: 850,
      deposit_whole_split: 500,
      deposit_quarter: 250,
    };
  }

  return Object.fromEntries(data.map((row) => [row.key, Number(row.value)]));
}

// Resolve deposit amount for a purchase type using config values
function resolveDepositAmount(purchaseType: string, config: Record<string, number>): number {
  switch (purchaseType) {
    case 'whole':   return config['deposit_whole_single'] ?? 850;
    case 'half':    return config['deposit_half']         ?? 500;
    case 'quarter': return config['deposit_quarter']      ?? 250;
    default:        return config['deposit_half']         ?? 500;
  }
}

// Fetch per-size prices from the config table
async function fetchPriceConfig(): Promise<Record<string, number>> {
  const { data, error } = await supabaseAdmin
    .from('config')
    .select('key, value')
    .in('key', ['price_whole', 'price_half', 'price_quarter']);

  // Start with hardcoded fallbacks
  const result: Record<string, number> = {
    price_whole:   8.00,
    price_half:    8.25,
    price_quarter: 8.50,
  };

  if (error || !data) {
    console.error('Error fetching price config, using fallbacks:', error);
    return result;
  }

  // Override fallbacks with any values found in config
  for (const row of data) {
    result[row.key] = Number(row.value);
  }

  return result;
}

// Resolve price per lb for a purchase type from config
function resolvePricePerLb(purchaseType: string, priceConfig: Record<string, number>): number {
  switch (purchaseType) {
    case 'whole':   return priceConfig['price_whole']   ?? 8.00;
    case 'half':    return priceConfig['price_half']    ?? 8.25;
    case 'quarter': return priceConfig['price_quarter'] ?? 8.50;
    default:        return priceConfig['price_half']    ?? 8.25;
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

    const [{ data: animals, error }, depositConfig, priceConfig] = await Promise.all([
      query,
      fetchDepositAmounts(),
      fetchPriceConfig(),
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
        const pricePerLb = resolvePricePerLb(purchaseType, priceConfig);
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
          deposit_amount:        resolveDepositAmount(purchaseType, depositConfig),
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
