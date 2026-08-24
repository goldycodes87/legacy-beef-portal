export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { emailBase, ctaButton, orderCard } from '@/lib/email-templates';
import { getConfig, getDepositAmount } from '@/lib/config';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { session_id } = await request.json();

  // Load session + owner + animal
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select(`
      id, group_id, animal_id, purchase_type, group_size, invite_expires_at, partner_emails, partner_names,
      customers (id, name, email),
      animals (id, name, animal_type, butcher_date)
    `)
    .eq('id', session_id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const owner = session.customers as unknown as { id: string; name: string; email: string };
  const animal = session.animals as unknown as { id: string; name: string; animal_type: string; butcher_date: string };
  // Partners always take the split deposit.
  const depositAmount = getDepositAmount(
    await getConfig(),
    session.purchase_type,
    true,
    animal?.animal_type
  );
  const purchaseLabel = session.purchase_type.charAt(0).toUpperCase() + session.purchase_type.slice(1);

  // Send invitation email to each partner
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  for (const partnerEmail of (session.partner_emails as string[]) || []) {
    const ownerFirstName = owner.name?.split(' ')[0] ?? 'Your friend';
    const emailIndex = ((session.partner_emails as string[]) || []).indexOf(partnerEmail);
    const partnerNames = (session.partner_names as string[]) || [];
    const partnerFirstName = partnerNames[emailIndex]?.trim() || partnerEmail.split('@')[0]; // Use real name with fallback
    const preheader = 'Claim your spot before it expires in 48 hours.';

    const content = `
      <table role="presentation" width="100%" style="border-radius:12px;margin:0 0 28px;"><tr><td bgcolor="#1A3D2B" style="background:linear-gradient(135deg,#1A3D2B 0%,#2d6a4f 100%);border-radius:12px;padding:28px 24px;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">🥩</div>
        <h2 style="font-family:Georgia,serif;color:white;font-size:26px;margin:0 0 8px;font-weight:normal;">
          ${ownerFirstName} wants to split a beef with you.
        </h2>
        <p style="color:#C4A46B;font-size:14px;margin:0;font-family:Arial,sans-serif;letter-spacing:0.5px;">
          Your spot is being held for 48 hours.
        </p>
      </td></tr></table>
      <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Hey ${partnerFirstName} — ${ownerFirstName} just reserved a ${purchaseLabel} Beef from Legacy Land & Cattle here in Colorado Springs and wants you to split it. That means ranch-direct, custom-cut beef in your freezer for months — at a better price than buying solo.
      </p>
      ${orderCard([
        { label: 'Your Share', value: `${purchaseLabel} Beef` },
        { label: 'Animal Type', value: `${animal.name}` },
        { label: 'Butcher Date', value: `${formatDate(animal.butcher_date)}` },
        { label: 'Your Deposit', value: `$${depositAmount}.00` },
      ])}
      <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:24px 0 16px;">
        Your spot is held for <strong>48 hours</strong>. After that it will be released and ${ownerFirstName} will need to find another partner or adjust their order.
      </p>
      ${ctaButton('Claim My Spot →', `${APP_URL}/join/${session.group_id}`)}
      <p style="color:#9CA3AF;font-size:12px;font-family:Arial,sans-serif;text-align:center;">
        Questions? Call us at (719) 258-1777 or reply to this email.
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
