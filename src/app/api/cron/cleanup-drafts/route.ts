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
    const { emailBase, ctaButton } = await import('@/lib/email-templates');
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
      const content = `
        <table role="presentation" width="100%" style="border-radius:12px;margin:0 0 28px;">
        <tr><td bgcolor="#1A3D2B" style="background:linear-gradient(135deg,#1A3D2B 0%,#2d6a4f 100%);border-radius:12px;padding:28px 24px;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">⏰</div>
          <h2 style="font-family:Georgia,serif;color:white;font-size:24px;margin:0 0 8px;font-weight:normal;">
            Your spot is being held, ${firstName}.
          </h2>
          <p style="color:#C4A46B;font-size:14px;margin:0;">Complete your deposit to lock it in.</p>
        </td></tr></table>
        <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 24px;">
          You started a reservation for <strong>${purchaseLabel}</strong> but haven't completed your deposit.
          Your spot is held for 24 hours — after that it will be released.
        </p>
        ${ctaButton('Complete My Deposit →', paymentUrl)}
        <p style="color:#9CA3AF;font-size:12px;text-align:center;margin-top:16px;">Questions? Call (719) 258-1777.</p>
      `;
      try {
        await resend.emails.send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: customer.email,
          subject: `Your spot is being held, ${firstName} — complete your deposit`,
          html: emailBase(content, 'Complete your deposit to lock in your beef.'),
        });
        await supabase.from('sessions')
          .update({ nudge_sent_at: new Date().toISOString() })
          .eq('id', session.id);
      } catch (e) {
        console.error('Nudge email error:', e);
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
