export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { build, cutSheetLocked, cutSheetLockedPartner } from '@/lib/email-content';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legacylandandcattleco.com';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const supabase = getSupabaseAdmin();
  const portalOrigin = request.nextUrl.origin;
  const { half } = await request.json().catch(() => ({} as { half?: string }));
  const halfValue = half === 'A' || half === 'B' ? half : null;
  const now = new Date().toISOString();

  const { data: session } = await supabase
    .from('sessions')
    .select(`
      id, cut_sheet_partner_session_id, access_token, dual_cut_sheet,
      half_a_complete, half_b_complete, cut_sheet_locked_at,
      customers (id, name, email),
      animals (name, butcher_date)
    `)
    .eq('id', uuid)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
  }

  if (halfValue) {
    await supabase
      .from('cut_sheet_answers')
      .update({ locked: true })
      .eq('session_id', uuid)
      .eq('half', halfValue);

    const sessionUpdate: Record<string, any> = halfValue === 'A'
      ? { half_a_complete: true, half_a_locked_at: now }
      : { half_b_complete: true, half_b_locked_at: now };
    const otherHalfComplete = halfValue === 'A' ? session.half_b_complete : session.half_a_complete;

    if (otherHalfComplete) {
      sessionUpdate.status = 'locked';
      sessionUpdate.cut_sheet_complete = true;
      sessionUpdate.cut_sheet_locked_at = session.cut_sheet_locked_at || now;
    }

    await supabase
      .from('sessions')
      .update(sessionUpdate)
      .eq('id', uuid);

    if (!otherHalfComplete) {
      return NextResponse.json({ success: true });
    }
  } else {
    await supabase
      .from('cut_sheet_answers')
      .update({ locked: true })
      .eq('session_id', uuid);

    await supabase
      .from('sessions')
      .update({
        status: 'locked',
        cut_sheet_complete: true,
        cut_sheet_locked_at: now,
      })
      .eq('id', uuid);
  }

  const mainCustomer = Array.isArray((session as any)?.customers)
    ? (session as any).customers[0]
    : (session as any)?.customers;
  const mainAnimal = Array.isArray((session as any)?.animals)
    ? (session as any).animals[0]
    : (session as any)?.animals;

  const firstName = mainCustomer?.name?.split(' ')[0] ?? 'there';
  const butcherDate = mainAnimal?.butcher_date
    ? new Date(mainAnimal.butcher_date)
      .toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : 'your scheduled date';
  const accessToken = (session as any)?.access_token;
  // /api/token/<token> is the only route that consumes an access token.
  const reviewLink = accessToken
    ? `${APP_URL}/api/token/${accessToken}`
    : `${APP_URL}`;

  const { data: answers } = await supabase
    .from('cut_sheet_answers')
    .select('section, answers, half')
    .eq('session_id', uuid);

  // Half A/B splitting, the preheader and the headline all live in the
  // template now, so they cannot drift from what the preview shows.

  if (mainCustomer?.email) {
    const customerEmail = build(cutSheetLocked, {
      firstName,
      butcherDate,
      reviewUrl: reviewLink,
      bothHalves: !!halfValue,
      answers: (answers || []) as any,
    });

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: mainCustomer.email,
      subject: customerEmail.subject,
      html: customerEmail.html,
    }).catch(err =>
      console.error('Cut sheet lock email error:', err));

    // Grant notification
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && resendKey !== 're_placeholder_set_in_vercel') {
        const { Resend: ResendGrant } = await import('resend');
        const resendG = new ResendGrant(resendKey);
        await resendG.emails.send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: 'grant@legacylandandcattleco.com',
          subject: `Cut Sheet Locked — ${mainCustomer.name} (${mainAnimal?.name || 'Order'})`,
          html: `
            <ul>
              <li><strong>Customer:</strong> ${mainCustomer.name} (${mainCustomer.email})</li>
              <li><strong>Order:</strong> ${mainAnimal?.name || 'N/A'}</li>
              <li><strong>Locked At:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          `,
        });
      }
    } catch (grantErr) {
      console.error('Grant notification error:', grantErr);
    }

    try {
      await fetch(`${portalOrigin}/api/notify-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-notify-secret': process.env.ADMIN_NOTIFY_SECRET || '',
        },
        body: JSON.stringify({
          title: '✂️ Cut Sheet Locked',
          body: `Cut sheet locked for ${mainCustomer.name}`,
          url: '/cut-sheets',
        }),
      });
    } catch (notifyErr) {
      console.error('Admin notify failed (cut sheet):', notifyErr);
    }
  }

  // If this is a split session, also lock partner's cut sheet
  if (session?.cut_sheet_partner_session_id) {
    await supabase
      .from('cut_sheet_answers')
      .update({ locked: true })
      .eq('session_id', session.cut_sheet_partner_session_id);

    // A split shares one cut sheet, so when it locks the partner is done too.
    // Without this their reservation stayed on "Cut sheet open" in the admin
    // for good, and nothing the partner did could clear it.
    await supabase
      .from('sessions')
      .update({
        status: 'locked',
        cut_sheet_complete: true,
        cut_sheet_locked_at: now,
      })
      .eq('id', session.cut_sheet_partner_session_id)
      .eq('cut_sheet_complete', false);

    // Fetch partner session + customer for email
    const { data: partnerSession } = await supabase
      .from('sessions')
      .select('id, customers(name, email)')
      .eq('id', session.cut_sheet_partner_session_id)
      .single();

    const partnerCustomer = partnerSession?.customers as unknown as { name: string; email: string } | null;

    if (partnerCustomer?.email) {
      const firstName = partnerCustomer.name?.split(' ')[0] ?? 'there';

      const partnerEmail = build(cutSheetLockedPartner, {
        firstName,
        butcherDate,
        reviewUrl: reviewLink,
        bothHalves: !!halfValue,
        answers: (answers || []) as any,
      });



      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails
        .send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: partnerCustomer.email,
          subject: partnerEmail.subject,
          html: partnerEmail.html,
        })
        .catch((err) => console.error('Partner cut sheet lock email error:', err));
    }
  }

  return NextResponse.json({ success: true });
}
