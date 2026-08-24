export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getAccountData } from '@/lib/account';
import AccountClient from './AccountClient';

/**
 * Where a returning customer lands after following their sign-in link.
 * Without a valid access cookie there is nothing to show, so send them back to
 * ask for a fresh link rather than rendering an empty shell.
 */
export default async function AccountPage() {
  const account = await getAccountData();
  if (!account) redirect('/returning?expired=1');

  return <AccountClient account={account} />;
}
