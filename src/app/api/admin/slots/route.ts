export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

/**
 * Retired. This endpoint returned every customer's name, email, and order to
 * anyone who requested it — it had no authentication and sat on the public
 * customer site. The same view lives in the admin app behind a login:
 * admin.legacylandandcattleco.com/slots
 *
 * Safe to delete this file along with src/app/slots.
 */
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
