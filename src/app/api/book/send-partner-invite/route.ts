export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { build, partnerInvite } from '@/lib/email-content';
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

    const { subject, html } = build(partnerInvite, {
      ownerFirstName,
      partnerFirstName,
      purchaseLabel: `${purchaseLabel} Beef`,
      animalName: animal.name,
      butcherDate: formatDate(animal.butcher_date),
      depositAmount: Number(depositAmount),
      joinUrl: `${APP_URL}/join/${session.group_id}`,
    });


    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: partnerEmail,
      subject,
      html,
    }).catch(err => console.error('Resend error:', err));
  }

  return NextResponse.json({ success: true });
}
