/**
 * The per-lb prices shown on pages where the customer has not yet picked how
 * the animal was raised (the weight explainer and the size picker).
 *
 * These pages used to read the bare `price_whole` / `price_half` /
 * `price_quarter` config keys. The admin Settings page does not edit those —
 * it writes the per-animal-type keys — so after any price change the marketing
 * pages kept quoting the old figure while checkout charged the new one.
 *
 * Grass-fed and grain-finished are priced the same, so grass-fed is the honest
 * representative figure; Wagyu is quoted separately where it is offered.
 */

export interface ShownPrices {
  whole: number;
  half: number;
  quarter: number;
}

export const FALLBACK_SHOWN_PRICES: ShownPrices = {
  whole: 8.0,
  half: 8.25,
  quarter: 8.5,
};

function pick(
  config: Record<string, string> | null | undefined,
  size: 'whole' | 'half' | 'quarter'
): number {
  // Per-type key first, then the legacy flat key, then the constant.
  const candidates = [config?.[`price_${size}_grass_fed`], config?.[`price_${size}`]];
  for (const c of candidates) {
    const n = parseFloat(c ?? '');
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return FALLBACK_SHOWN_PRICES[size];
}

export function readShownPrices(config: Record<string, string> | null | undefined): ShownPrices {
  return {
    whole: pick(config, 'whole'),
    half: pick(config, 'half'),
    quarter: pick(config, 'quarter'),
  };
}
