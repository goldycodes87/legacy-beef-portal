export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const nudgeCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  // Send nudge email to sessions 2-24 hours old not yet nudged
  const { data: nudgeSessions } = await supabase
    .from('sessions')
    .select('id, purchase_type, customers(name, email), animals(name, butcher_date)')
    .eq('status', 'draft')
    .lt('created_at', nudgeCutoff)
    .gt('created_at', cutoff)
    .is('nudge_sent_at', null)
    .not('intended_payment_method', 'in', '(check,cash)');

  if (nudgeSessions && nudgeSessions.length > 0) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const { build, lostCart } = await import('@/lib/email-content');
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';
    for (const session of nudgeSessions) {
      const customer = Array.isArray((session as any).customers)
        ? (session as any).customers[0] : (session as any).customers;
      const animal = Array.isArray((session as any).animals)
        ? (session as any).animals[0] : (session as any).animals;
      if (!customer?.email) continue;
      const firstName = customer.name?.split(' ')[0] ?? 'there';
      const purchaseLabel = session.purchase_type === 'whole' ? 'Whole Beef'
        : session.purchase_type === 'half' ? 'Half Beef' : 'Quarter Beef';
      const paymentUrl = `${APP_URL}/payment?session=${session.id}`;
      const { subject, html } = build(lostCart, {
        firstName,
        purchaseLabel,
        paymentUrl,
      });
      try {
        await resend.emails.send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: customer.email,
          subject,
          html,
        });
        await supabase.from('sessions')
          .update({ nudge_sent_at: new Date().toISOString() })
          .eq('id', session.id);
      } catch (e) {
        console.error('Nudge email error:', e);
      }
    }
  }

  // Auto-settle $0 deposits for sessions past butcher date with no deposit payment record
  const today = new Date().toISOString().split('T')[0];

  const { data: unpaidSessions } = await supabase
    .from('sessions')
    .select(`
      id, purchase_type, is_splitting, intended_payment_method,
      animals (butcher_date)
    `)
    .in('status', ['locked', 'deposit_paid'])
    .not('intended_payment_method', 'in', '(card)')
    .lte('animals.butcher_date', today);

  if (unpaidSessions && unpaidSessions.length > 0) {
    for (const session of unpaidSessions) {
      // Check if deposit payment already exists
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('session_id', session.id)
        .eq('type', 'deposit')
        .maybeSingle();

      if (!existingPayment) {
        // Insert $0 deposit to settle the account
        await supabase.from('payments').insert({
          session_id: session.id,
          type: 'deposit',
          method: session.intended_payment_method || 'check',
          amount_cents: 0,
          status: 'paid',
          paid_at: new Date().toISOString(),
        });
        console.log(`Auto-settled $0 deposit for session ${session.id}`);
      }
    }
  }

  // Find expired draft sessions
  const { data: expiredDrafts } = await supabase
    .from('sessions')
    .select('id, animal_id, purchase_type, intended_payment_method')
    .eq('status', 'draft')
    .lt('created_at', cutoff)
    .not('intended_payment_method', 'in', '(check,cash)');

  if (!expiredDrafts || expiredDrafts.length === 0) {
    return NextResponse.json({ cancelled: 0 });
  }

  let cancelled = 0;
  for (const session of expiredDrafts) {
    // Decrement units_used
    const unitCost = session.purchase_type === 'whole' ? 1.0 : session.purchase_type === 'half' ? 0.5 : 0.25;
    const { data: animal } = await supabase
      .from('animals')
      .select('units_used')
      .eq('id', session.animal_id)
      .single();
    if (animal) {
      await supabase.from('animals')
        .update({ units_used: Math.max(0, (animal.units_used || 0) - unitCost) })
        .eq('id', session.animal_id);
    }
    // Cancel the session
    await supabase.from('sessions')
      .update({ status: 'cancelled' })
      .eq('id', session.id);
    cancelled++;
  }

  return NextResponse.json({ cancelled });
}
