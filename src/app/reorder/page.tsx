export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getAccountData } from '@/lib/account';
import { getShownPrices } from '@/lib/shown-data';
import ReorderClient from './ReorderClient';

export default async function ReorderPage() {
  const [account, prices] = await Promise.all([getAccountData(), getShownPrices()]);
  if (!account) redirect('/returning?expired=1');

  return <ReorderClient account={account} prices={prices} />;
}
