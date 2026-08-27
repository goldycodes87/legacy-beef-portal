export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { build, cashCheckInstructions } from '@/lib/email-content';

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
        .select(`id, purchase_type, deposit_amount, customers (name, email, phone), animals (name, butcher_date, animal_type)`)
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

        // The customer used to get nothing at this point — no amount, no
        // address, no idea how to actually pay. Now they get instructions.
        const firstName = customer.name?.split(' ')[0] ?? 'there';
        const depositAmount = Number((session as any)?.deposit_amount) || 0;
        const instructions = build(cashCheckInstructions, {
          firstName,
          purchaseLabel,
          animalName: animal.name,
          butcherDate,
          depositAmount,
          method: safeMethod as 'cash' | 'check',
        });
        await resend.emails.send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: customer.email,
          subject: instructions.subject,
          html: instructions.html,
        }).catch((err: unknown) => console.error('Cash/check instructions email failed:', err));

        await resend.emails.send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: 'orders@legacylandandcattleco.com',
          subject: `Spot Locked (${methodLabel}) — ${purchaseLabel} ${animalType} — ${customer.name}`,
          html: `<ul>
            <li><strong>Customer:</strong> ${customer.name} (${customer.email})</li>
            <li><strong>Order:</strong> ${purchaseLabel} — ${animalType}</li>
            <li><strong>Butcher Date:</strong> ${butcherDate}</li>
            <li><strong>Deposit Due:</strong> ${depositAmount.toFixed(2)} — ${methodLabel} (not yet received)</li>
            <li><strong>Phone:</strong> ${(customer as any).phone || 'not on file'}</li>
            <li><strong>Status:</strong> Spot held — awaiting deposit</li>
          </ul>`,
        });
      }
    } catch (notifyErr) {
      console.error('Grant notify error:', notifyErr);
    }

    try {
      const { sendAdminSms } = await import('@/lib/sms');
      const { data: s2 } = await supabase
        .from('sessions')
        .select('deposit_amount, customers (name, phone)')
        .eq('id', uuid)
        .single();
      const c2 = Array.isArray((s2 as any)?.customers) ? (s2 as any).customers[0] : (s2 as any)?.customers;
      await sendAdminSms(
        `✍️ ${c2?.name || 'A customer'} chose ${safeMethod} for their ${Number((s2 as any)?.deposit_amount || 0).toFixed(2)} deposit — not yet received. ${c2?.phone || ''}`
      );
    } catch (smsErr) {
      console.error('Cash/check SMS failed:', smsErr);
    }
  }

  return NextResponse.json({ success: true });
}
