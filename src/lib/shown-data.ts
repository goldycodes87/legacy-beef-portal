import { getConfig, getPricePerLb, getDepositAmount } from '@/lib/config';
import { readShownPrices, FALLBACK_SHOWN_PRICES, type ShownPrices } from '@/lib/display-prices';

/**
 * Server-side data for the marketing pages, so prices, dates and availability
 * are correct in the first paint rather than corrected after hydration.
 */

export interface SizeOffer {
  size: 'whole' | 'half' | 'quarter';
  label: string;
  pricePerLb: number;
  depositAmount: number;
  spotsRemaining: number;
  estLow: number;
  estHigh: number;
  /** Take-home boxed beef, ~50% of hanging weight. */
  boxedLow: number;
  boxedHigh: number;
}

export interface HomeOffer {
  /** Formatted soonest open butcher date, e.g. "October 7, 2026". */
  nextButcherDate: string | null;
  sizes: SizeOffer[];
}

const SHARE: Record<SizeOffer['size'], number> = { whole: 1, half: 0.5, quarter: 0.25 };
const LABEL: Record<SizeOffer['size'], string> = { whole: 'Whole', half: 'Half', quarter: 'Quarter' };

// Hanging weight ranges per size, matching /api/slots.
const WEIGHT_RANGE: Record<SizeOffer['size'], [number, number]> = {
  whole: [650, 775],
  half: [325, 390],
  quarter: [163, 195],
};

export async function getShownPrices(): Promise<ShownPrices> {
  try {
    const config = await getConfig();
    const asStrings: Record<string, string> = {};
    for (const [k, v] of Object.entries(config)) asStrings[k] = String(v);
    return readShownPrices(asStrings);
  } catch {
    return FALLBACK_SHOWN_PRICES;
  }
}

/**
 * What is actually on offer: the soonest open butcher date, and for each size
 * the price, deposit, remaining spots and estimated total. Prices and deposits
 * come from the same config the booking flow charges from.
 */
function buildSizes(
  config: Awaited<ReturnType<typeof getConfig>>,
  representative: string,
  spots: (size: SizeOffer['size']) => number
): SizeOffer[] {
  return (['whole', 'half', 'quarter'] as const).map((size) => {
    const pricePerLb = getPricePerLb(config, size, representative);
    const [lo, hi] = WEIGHT_RANGE[size];
    const roundTo50 = (n: number) => Math.round(n / 50) * 50;
    const roundTo5 = (n: number) => Math.round(n / 5) * 5;
    return {
      size,
      label: LABEL[size],
      pricePerLb,
      depositAmount: getDepositAmount(config, size, false, representative),
      spotsRemaining: spots(size),
      estLow: roundTo50(lo * pricePerLb),
      estHigh: roundTo50(hi * pricePerLb),
      boxedLow: roundTo5(lo * 0.5),
      boxedHigh: roundTo5(hi * 0.5),
    };
  });
}

/**
 * The home offer, but never empty-handed: with no open butcher date the
 * pricing section still shows this season's rates from config, with zero
 * spots so the page reads "join the waitlist" instead of prices vanishing.
 */
export async function getStandingOffer(): Promise<HomeOffer> {
  const offer = await getHomeOffer();
  if (offer.sizes.length > 0) return offer;
  try {
    const config = await getConfig();
    return { nextButcherDate: null, sizes: buildSizes(config, 'grain_finished', () => 0) };
  } catch {
    return offer;
  }
}

export async function getHomeOffer(): Promise<HomeOffer> {
  const empty: HomeOffer = { nextButcherDate: null, sizes: [] };

  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase-admin');
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: animals }, config] = await Promise.all([
      supabase
        .from('animals')
        .select('animal_type, butcher_date, total_animals, units_used')
        .eq('status', 'available')
        .gte('butcher_date', today)
        .order('butcher_date', { ascending: true }),
      getConfig(),
    ]);

    const open = (animals || []).filter(
      (a) => (a.total_animals || 0) - (a.units_used || 0) > 0
    );
    if (open.length === 0) return empty;

    // Everything on the soonest date that still has room.
    const nextDate = open[0].butcher_date as string;
    const onDate = open.filter((a) => a.butcher_date === nextDate);
    const remainingUnits = onDate.reduce(
      (sum, a) => sum + Math.max(0, (a.total_animals || 0) - (a.units_used || 0)),
      0
    );

    // Quote the non-Wagyu price; Wagyu is offered separately.
    const representative =
      onDate.find((a) => a.animal_type !== 'wagyu')?.animal_type ?? onDate[0].animal_type;

    const sizes = buildSizes(config, representative, (size) =>
      Math.floor(remainingUnits / SHARE[size])
    );

    return {
      nextButcherDate: new Date(nextDate + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      sizes,
    };
  } catch (err) {
    // Falling back silently would show "fully claimed" on a page that is in
    // fact open for business, so make the failure visible in the runtime logs.
    console.error('getHomeOffer failed:', err);
    return empty;
  }
}

/** The soonest butcher date still open, formatted, or null if nothing is. */
export async function getNextButcherDate(): Promise<string | null> {
  return (await getHomeOffer()).nextButcherDate;
}
