export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { emailBase, ctaButton, orderCard } from '@/lib/email-templates';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { session_id } = await request.json();

  // Load session + owner + animal
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select(`
      id, group_id, animal_id, purchase_type, group_size, invite_expires_at, partner_emails,
      customers (id, name, email),
      animals (id, name, butcher_date)
    `)
    .eq('id', session_id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const owner = session.customers as unknown as { id: string; name: string; email: string };
  const animal = session.animals as unknown as { id: string; name: string; butcher_date: string };
  const depositMap: Record<string, number> = { whole: 500, half: 250, quarter: 250 };
  const depositAmount = depositMap[session.purchase_type] || 250;
  const purchaseLabel = session.purchase_type.charAt(0).toUpperCase() + session.purchase_type.slice(1);

  // Send invitation email to each partner
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  for (const partnerEmail of (session.partner_emails as string[]) || []) {
    const ownerFirstName = owner.name?.split(' ')[0] ?? 'Your friend';
    const partnerFirstName = partnerEmail.split('@')[0]; // Fallback to email prefix
    const preheader = 'Claim your spot before it expires in 48 hours.';

    const content = `
      <h2 style="font-family:Georgia,serif;color:#0F0F0F;font-size:22px;margin:0 0 8px;">
        Hey ${partnerFirstName}!
      </h2>
      <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">
        ${owner.name} is reserving ${purchaseLabel} of locally raised beef from
        Legacy Land & Cattle in Colorado Springs, CO — and they want to split it with you.
      </p>

      <div style="background:#F0F7E8;border:1px solid #c3dfa0;border-radius:10px;padding:20px;margin:20px 0;">
        <p style="font-weight:700;color:#1A3D2B;margin:0 0 8px;">What is this?</p>
        <p style="color:#6B7280;font-size:13px;margin:0;line-height:1.6;">
          Legacy Land & Cattle raises grass-fed and grain-finished beef right
          here in Colorado Springs. You buy a share directly from the ranch —
          custom cut exactly how you want it, frozen and ready for pickup.
          No grocery store middleman. Just real beef from real cattle.
        </p>
      </div>

      ${orderCard([
        { label: 'Your Share', value: purchaseLabel },
        { label: 'Animal', value: animal.name },
        { label: 'Butcher Date', value: new Date(animal.butcher_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
        { label: 'Your Deposit', value: `$${depositAmount.toFixed(2)}` },
        { label: 'Price/lb', value: 'TBD' },
      ])}

      <p style="color:#E85D24;font-weight:700;font-size:14px;">
        You have 48 hours to claim your spot.
      </p>
      <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:13px;">
        After that, it'll be released and ${ownerFirstName} will be notified.
      </p>

      ${ctaButton('Claim My Spot →', `${APP_URL}/join/${session.group_id}`)}

      <p style="font-size:12px;color:#aaa;text-align:center;font-family:Arial,sans-serif;">
        Questions? Reply to this email or contact us at <a href="mailto:orders@legacylandandcattleco.com" style="color:#E85D24;text-decoration:none;">
        orders@legacylandandcattleco.com
        </a>
      </p>
    `;

    const htmlEmail = emailBase(content, preheader);

    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: partnerEmail,
      subject: `${ownerFirstName} saved you a spot for beef 🐄`,
      html: htmlEmail,
    }).catch(err => console.error('Resend error:', err));
  }

  return NextResponse.json({ success: true });
}
