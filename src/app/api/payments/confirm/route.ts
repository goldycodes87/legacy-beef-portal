export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

/**
 * Retired.
 *
 * This was the Stripe-era confirmation hook. It marked any session
 * deposit_paid, inserted a "paid" payment row, and emailed the customer a
 * confirmation — with no authentication and no verification that money had
 * actually moved. Nothing in either app called it.
 *
 * Payments now go through Square: /api/payments/create-payment for deposits
 * and /api/payments/balance for balances, both of which charge the card
 * before recording anything. Cash and check deposits are confirmed by an
 * admin via the admin app.
 *
 * Safe to delete this file.
 */
export async function POST() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
