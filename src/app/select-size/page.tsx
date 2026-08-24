import SelectSizeClient from './SelectSizeClient';
import { getShownPrices } from '@/lib/shown-data';

// Prices change, and this page quotes them on every card.
export const dynamic = 'force-dynamic';

export default async function SelectSizePage() {
  const prices = await getShownPrices();
  return <SelectSizeClient prices={prices} />;
}
