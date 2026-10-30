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
      .select('id, name, email, phone')
      .eq('id', id)
      .maybeSingle();
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
