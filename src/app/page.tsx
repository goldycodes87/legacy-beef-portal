export const dynamic = 'force-dynamic';

import HomeClient from './HomeClient';
import { getShownPrices, getStandingOffer } from '@/lib/shown-data';

/**
 * Prices, the next butcher date and remaining spots are read on the server so
 * the first paint is already correct — the old page fetched them after
 * hydration, which meant search engines indexed fallback prices.
 */
export default async function HomePage() {
  const [prices, offer] = await Promise.all([getShownPrices(), getStandingOffer()]);

  return (
    <HomeClient
      prices={prices}
      sizes={offer.sizes}
      nextButcherDate={offer.nextButcherDate}
    />
  );
}
