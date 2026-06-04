export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const supabase = getSupabaseAdmin();
  const { uuid } = await params;
  const { method } = await request.json();

  const allowed = ['card', 'check', 'cash', 'echeck'];
  const safeMethod = allowed.includes(method) ? method : 'card';

  await supabase.from('sessions')
    .update({ intended_payment_method: safeMethod })
    .eq('id', uuid);

  if (safeMethod === 'check' || safeMethod === 'cash') {
    try {
      const { data: session } = await supabase
        .from('sessions')
        .select(`id, purchase_type, customers (name, email), animals (name, butcher_date, animal_type)`)
        .eq('id', uuid)
        .single();
      const customer = Array.isArray((session as any)?.customers)
        ? (session as any).customers[0] : (session as any)?.customers;
      const animal = Array.isArray((session as any)?.animals)
        ? (session as any).animals[0] : (session as any)?.animals;
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && customer && animal) {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        const purchaseLabel = (session as any)?.purchase_type === 'whole' ? 'Whole Beef'
          : (session as any)?.purchase_type === 'half' ? 'Half Beef' : 'Quarter Beef';
        const animalType = animal.animal_type === 'grass_fed' ? 'Grass-Fed'
          : animal.animal_type === 'grain_finished' ? 'Grain-Finished' : 'Wagyu';
        const butcherDate = animal.butcher_date
          ? new Date(animal.butcher_date + 'T00:00:00').toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })
          : 'TBD';
        const methodLabel = safeMethod === 'check' ? 'Check' : 'Cash';
        await resend.emails.send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: 'orders@legacylandandcattleco.com',
          subject: `Spot Locked (${methodLabel}) — ${purchaseLabel} ${animalType} — ${customer.name}`,
          html: `<ul>
            <li><strong>Customer:</strong> ${customer.name} (${customer.email})</li>
            <li><strong>Order:</strong> ${purchaseLabel} — ${animalType}</li>
            <li><strong>Butcher Date:</strong> ${butcherDate}</li>
            <li><strong>Deposit Method:</strong> ${methodLabel} (not yet received)</li>
            <li><strong>Status:</strong> Spot held — awaiting deposit</li>
          </ul>`,
        });
      }
    } catch (notifyErr) {
      console.error('Grant notify error:', notifyErr);
    }
  }

  return NextResponse.json({ success: true });
}
