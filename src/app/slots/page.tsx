import { notFound } from 'next/navigation';

/**
 * Retired. This page was an unauthenticated "Reservations Admin" table on the
 * public customer site, listing every customer's name, email, and order. The
 * real one lives in the admin app behind a login:
 * admin.legacylandandcattleco.com/slots
 *
 * Safe to delete this file along with src/app/api/admin.
 */
export default function RetiredSlotsPage() {
  notFound();
}
