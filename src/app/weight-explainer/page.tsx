import WeightExplainerClient from './WeightExplainerClient';
import { getShownPrices, getNextButcherDate } from '@/lib/shown-data';

// Prices and butcher dates change, and this page quotes both.
export const dynamic = 'force-dynamic';

export default async function WeightExplainerPage() {
  const [prices, nextButcherDate] = await Promise.all([
    getShownPrices(),
    getNextButcherDate(),
  ]);

  return <WeightExplainerClient prices={prices} nextButcherDate={nextButcherDate} />;
}
