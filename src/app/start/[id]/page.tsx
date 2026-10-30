import { supabaseAdmin } from '@/lib/supabase-admin';
import StartClient from './StartClient';

/**
 * The fast-pass link Rusty texts a prospective customer:
 * /start/<customer id> — the record Rusty already created for them.
 * Their name and phone ride into the booking funnel pre-filled, and the
 * funnel claims this same customer row at booking (no duplicate records).
 * A UUID is unguessable, same trust model as order access tokens.
 */
export default async function StartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let prefill: { id: string; first: string; last: string; email: string; phone: string } | null =
    null;

  if (/^[0-9a-f-]{36}$/i.test(id)) {
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, name, email, phone, archived_at')
      .eq('id', id)
      .is('archived_at', null)
      .maybeSingle();

    // The fast pass is for prospects. Once they have a reservation the link
    // is spent (they sign in like any customer), and archiving the customer
    // kills the link outright — that's Grant's revoke switch.
    if (customer) {
      const { count } = await supabaseAdmin
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customer.id)
        .neq('status', 'cancelled');
      if (count && count > 0) {
        const { redirect } = await import('next/navigation');
        redirect('/returning');
      }
    }

    if (customer) {
      const parts = String(customer.name || '').trim().split(/\s+/);
      const isPlaceholder = String(customer.email || '').endsWith('@invite.legacylandandcattleco.com');
      prefill = {
        id: customer.id,
        first: parts[0] || '',
        last: parts.slice(1).join(' '),
        email: isPlaceholder ? '' : customer.email || '',
        phone: customer.phone || '',
      };
    }
  }

  return <StartClient prefill={prefill} />;
}
