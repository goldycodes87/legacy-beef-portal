import { getConfig } from '@/lib/config';
import { readShownPrices, FALLBACK_SHOWN_PRICES, type ShownPrices } from '@/lib/display-prices';

/**
 * Server-side helpers for the marketing pages, so prices and dates are correct
 * in the first paint rather than corrected after hydration.
 */

export async function getShownPrices(): Promise<ShownPrices> {
  try {
    const config = await getConfig();
    // getConfig returns numbers; readShownPrices reads strings.
    const asStrings: Record<string, string> = {};
    for (const [k, v] of Object.entries(config)) asStrings[k] = String(v);
    return readShownPrices(asStrings);
  } catch {
    return FALLBACK_SHOWN_PRICES;
  }
}

/** The soonest butcher date still open, formatted, or null if nothing is. */
export async function getNextButcherDate(): Promise<string | null> {
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase-admin');
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().slice(0, 10);

    const { data } = await supabase
      .from('animals')
      .select('butcher_date, total_animals, units_used')
      .eq('status', 'available')
      .gte('butcher_date', today)
      .order('butcher_date', { ascending: true });

    const next = (data || []).find(
      (a) => (a.total_animals || 0) - (a.units_used || 0) > 0
    )?.butcher_date;

    if (!next) return null;
    return new Date(next + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}
