export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

/**
 * Retired.
 *
 * This was the Stripe-era balance redirect handler. It marked a balance paid
 * based purely on a `redirect_status=succeeded` query parameter, so anyone
 * could settle any order by visiting a URL. Nothing in either app called it.
 *
 * Card balances now go through /api/payments/balance, which charges via
 * Square first. Cash and check balances are recorded by an admin through
 * "Record balance payment" in the admin app.
 *
 * Safe to delete this file.
 */
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
