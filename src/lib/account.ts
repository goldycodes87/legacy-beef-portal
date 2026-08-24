import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { computeBalance, depositCreditCents, type PaymentRow } from '@/lib/money';

/**
 * Everything the returning-customer pages need.
 *
 * Access is the same capability the order links have always used: the
 * `order_access` cookie names one session, and holding it proves you are that
 * session's customer. From there we can safely show that customer's other
 * orders — but never anyone else's, so every query filters on customer_id.
 */

export interface OrderSummary {
  id: string;
  status: string;
  purchaseType: string;
  purchaseLabel: string;
  animalName: string | null;
  animalType: string | null;
  animalTypeLabel: string;
  butcherDate: string | null;
  butcherDateLabel: string;
  /** Sorted newest first by this. */
  butcherDateSort: string;
  pricePerLb: number;
  hangingWeight: number | null;
  totalCost: number;
  depositPaid: number;
  discount: number;
  balanceDue: number;
  balancePaid: boolean;
  cutSheetComplete: boolean;
  cutSheetLockedAt: string | null;
  isPast: boolean;
  statusLabel: string;
}

export interface AccountData {
  customerId: string;
  name: string;
  firstName: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  orders: OrderSummary[];
  /** Most recent finished order, used to offer "same as last time". */
  lastOrder: OrderSummary | null;
}

export const PURCHASE_LABEL: Record<string, string> = {
  whole: 'Whole Beef',
  half: 'Half Beef',
  quarter: 'Quarter Beef',
};

export const ANIMAL_TYPE_LABEL: Record<string, string> = {
  grass_fed: 'Grass-Fed',
  grain_finished: 'Grain-Finished',
  wagyu: 'Wagyu',
  no_preference: 'No preference',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Not finished',
  in_progress: 'In progress',
  deposit_paid: 'Deposit paid',
  locked: 'Cut sheet locked',
  processing: 'At the butcher',
  beef_ready: 'Ready for pickup',
  paid_in_full: 'Paid in full',
  picked_up: 'Picked up',
  complete: 'Complete',
  cancelled: 'Cancelled',
};

function fmtDate(d: string | null): string {
  if (!d) return 'Date to be set';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** The session id proved by the access cookie, or null. */
export async function getAccessedSessionId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get('order_access')?.value ?? null;
}

/**
 * Loads the signed-in customer and every order they have placed. Returns null
 * when there is no valid cookie, so callers can send the visitor to /returning.
 */
export async function getAccountData(): Promise<AccountData | null> {
  const sessionId = await getAccessedSessionId();
  if (!sessionId) return null;

  const supabase = getSupabaseAdmin();

  // Establish who the cookie belongs to before reading anything else.
  const { data: anchor } = await supabase
    .from('sessions')
    .select('id, customer_id')
    .eq('id', sessionId)
    .maybeSingle();

  if (!anchor?.customer_id) return null;

  const [{ data: customer }, { data: sessions }] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name, email, phone, address, city, state, zip')
      .eq('id', anchor.customer_id)
      .maybeSingle(),
    supabase
      .from('sessions')
      .select(
        `id, status, purchase_type, price_per_lb, hanging_weight_lbs, discount_amount,
         balance_paid, cut_sheet_complete, cut_sheet_locked_at, created_at,
         animals(name, animal_type, butcher_date),
         payments(id, type, status, amount_cents, surcharge_cents, paid_at)`
      )
      .eq('customer_id', anchor.customer_id)
      .not('status', 'eq', 'draft')
      .order('created_at', { ascending: false }),
  ]);

  if (!customer) return null;

  const today = new Date().toISOString().slice(0, 10);

  const orders: OrderSummary[] = (sessions || []).map((s: Record<string, any>) => {
    const animal = Array.isArray(s.animals) ? s.animals[0] : s.animals;
    const payments = (s.payments || []) as PaymentRow[];
    const { totalCost, discount, balanceDue } = computeBalance({
      hangingWeightLbs: s.hanging_weight_lbs,
      pricePerLb: s.price_per_lb,
      payments,
      discountAmount: s.discount_amount,
    });
    const butcherDate: string | null = animal?.butcher_date ?? null;

    return {
      id: s.id,
      status: s.status,
      purchaseType: s.purchase_type,
      purchaseLabel: PURCHASE_LABEL[s.purchase_type] || s.purchase_type,
      animalName: animal?.name ?? null,
      animalType: animal?.animal_type ?? null,
      animalTypeLabel: ANIMAL_TYPE_LABEL[animal?.animal_type] || 'Beef',
      butcherDate,
      butcherDateLabel: fmtDate(butcherDate),
      butcherDateSort: butcherDate || s.created_at,
      pricePerLb: Number(s.price_per_lb) || 0,
      hangingWeight: s.hanging_weight_lbs ? Number(s.hanging_weight_lbs) : null,
      totalCost,
      depositPaid: depositCreditCents(payments) / 100,
      discount,
      balanceDue: s.balance_paid ? 0 : balanceDue,
      balancePaid: !!s.balance_paid,
      cutSheetComplete: !!s.cut_sheet_complete,
      cutSheetLockedAt: s.cut_sheet_locked_at ?? null,
      isPast: !!butcherDate && butcherDate < today,
      statusLabel: STATUS_LABEL[s.status] || s.status,
    };
  });

  orders.sort((a, b) => (a.butcherDateSort < b.butcherDateSort ? 1 : -1));

  // "Same as last time" should quote a real previous purchase, not a
  // half-finished one, so only orders that got as far as a deposit count.
  const lastOrder =
    orders.find(
      (o) => o.status !== 'cancelled' && o.status !== 'draft' && o.animalType !== null
    ) ?? null;

  const name = customer.name || '';

  return {
    customerId: customer.id,
    name,
    firstName: name.split(' ')[0] || 'there',
    email: customer.email,
    phone: customer.phone ?? null,
    address: customer.address ?? null,
    city: customer.city ?? null,
    state: customer.state ?? null,
    zip: customer.zip ?? null,
    orders,
    lastOrder,
  };
}
