export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { emailBase, orderCard } from '@/lib/email-templates';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const sessionId = new URL(request.url).searchParams.get('session_id');
  const redirectStatus = new URL(request.url).searchParams.get('redirect_status');

  if (redirectStatus === 'succeeded') {
    // Update session
    await supabase
      .from('sessions')
      .update({
        balance_paid: true,
        balance_paid_at: new Date().toISOString(),
        balance_payment_method: 'card',
      })
      .eq('id', sessionId);

    // Send confirmation email
    const { data: session } = await supabase
      .from('sessions')
      .select('id, customers(email, name)')
      .eq('id', sessionId)
      .single();

    const customer = Array.isArray(session?.customers) ? session.customers[0] : session?.customers;

    if (customer) {
      // Fetch payment to get amount
      const { data: payments } = await supabase
        .from('payments')
        .select('amount_cents')
        .eq('session_id', sessionId)
        .eq('type', 'balance')
        .order('paid_at', { ascending: false })
        .limit(1);

      const amountPaid = payments?.[0]?.amount_cents ? (payments[0].amount_cents / 100).toFixed(2) : '0.00';
      const firstName = customer.name?.split(' ')[0] ?? 'there';
      const paymentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      const preheader = 'Your account is all squared away.';
      const content = `
        <h2 style="font-family:Georgia,serif;color:#0F0F0F;font-size:22px;margin:0 0 8px;">
          Payment received, ${firstName}. You're all set! ✓
        </h2>

        ${orderCard([
          { label: 'Amount Paid', value: `$${amountPaid}` },
          { label: 'Date', value: paymentDate },
          { label: 'Method', value: 'Credit Card' },
          { label: 'Balance Status', value: 'Paid in Full ✓' },
        ])}

        <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:14px;">
          See you at pickup!
        </p>
      `;

      const htmlEmail = emailBase(content, preheader);

      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
        to: customer.email,
        subject: 'Balance payment received — thank you! ✓',
        html: htmlEmail,
      });
    }

    const response = NextResponse.redirect(new URL(`/session/${sessionId}/pickup`, request.url));
    return response;
  }

  return NextResponse.redirect(new URL(`/payment?error=balance_failed`, request.url));
}
