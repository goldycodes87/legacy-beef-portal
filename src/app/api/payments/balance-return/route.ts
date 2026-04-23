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

      const preheader = `You&apos;re all paid up, ${firstName}. See you at pickup!`;
      const content = `
        <div style="background:linear-gradient(135deg,#1A3D2B 0%,#2d6a4f 100%);border-radius:12px;padding:28px 24px;text-align:center;margin:0 0 28px;">
          <div style="font-size:40px;margin-bottom:8px;">💳</div>
          <h2 style="font-family:Georgia,serif;color:white;font-size:24px;margin:0 0 8px;font-weight:normal;">
            You&apos;re all paid up, ${firstName}.
          </h2>
          <p style="color:#C4A46B;font-size:14px;margin:0;font-family:Arial,sans-serif;">
            Balance paid in full. Nothing left to do but show up.
          </p>
        </div>
        <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 24px;">
          Your balance payment has been received and your account is fully settled. Here&apos;s your receipt:
        </p>
        ${orderCard([
          { label: 'Amount Paid', value: '$' + amountPaid },
          { label: 'Date', value: paymentDate },
          { label: 'Method', value: 'Credit Card' },
          { label: 'Balance Status', value: 'Paid in Full ✓' },
        ])}
        <div style="background:#F0F7E8;border:1px solid #c3dfa0;border-radius:12px;padding:16px 20px;margin:24px 0;text-align:center;">
          <p style="font-family:Arial,sans-serif;font-size:15px;color:#1A3D2B;margin:0;font-weight:bold;">
            ✅ All done. Just show up for pickup and we&apos;ll load you out.
          </p>
        </div>
        <p style="color:#9CA3AF;font-size:12px;font-family:Arial,sans-serif;text-align:center;">
          Questions? Call us at (719) 258-1777 or reply to this email.
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
