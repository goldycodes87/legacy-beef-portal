export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAccountData } from '@/lib/account';

/**
 * Just enough about the signed-in customer for pages to change their copy —
 * how many orders they have placed and what to call them. Deliberately not the
 * full account payload, which no client page needs.
 */
export async function GET() {
  const account = await getAccountData();
  if (!account) return NextResponse.json({ orderCount: null });

  return NextResponse.json({
    firstName: account.firstName,
    orderCount: account.orders.filter((o) => o.status !== 'cancelled').length,
  });
}
