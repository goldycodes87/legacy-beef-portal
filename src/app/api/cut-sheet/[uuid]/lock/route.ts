export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { emailBase, cutSheetSummary } from '@/lib/email-templates';

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

  const halfAAnswers = (answers || []).filter(a => (a.half ?? null) === 'A');
  const halfBAnswers = (answers || []).filter(a => (a.half ?? null) === 'B');

  const summaryHtml = halfValue
    ? `
      <p style="font-family:Arial,sans-serif;font-size:13px;color:#1A3D2B;margin:12px 0 6px;font-weight:bold;">HALF A</p>
      ${cutSheetSummary(halfAAnswers || [])}
      <p style="font-family:Arial,sans-serif;font-size:13px;color:#1A3D2B;margin:16px 0 6px;font-weight:bold;">HALF B</p>
      ${cutSheetSummary(halfBAnswers || [])}
    `
    : cutSheetSummary(answers || []);

  const preheader = halfValue
    ? `Nice work, ${firstName} — both halves are confirmed.`
    : `Nice work, ${firstName} — your cut sheet is done.`;
  const headline = halfValue
    ? 'Both halves are locked in.'
    : `Your cut sheet is done, ${firstName}.`;
  const subhead = halfValue
    ? 'We have instructions for Half A and Half B.'
    : "We've got your cutting instructions.";

  if (mainCustomer?.email) {
    const content = `
      <table role="presentation" width="100%" style="border-radius:12px;margin:0 0 28px;"><tr><td bgcolor="#1A3D2B" style="background:linear-gradient(135deg,#1A3D2B 0%,#2d6a4f 100%);border-radius:12px;padding:28px 24px;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">✅</div>
        <h2 style="font-family:Georgia,serif;color:white;font-size:24px;margin:0 0 8px;font-weight:normal;">
          ${headline}
        </h2>
        <p style="color:#C4A46B;font-size:14px;margin:0;font-family:Arial,sans-serif;">
          ${subhead}
        </p>
      </td></tr></table>
      <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 16px;">
        ${halfValue
          ? 'Your cut sheets are locked and will be hand-delivered to T-K Processing in Cañon City before butcher day.'
          : "You just made the most important decision of this whole process — and we've got every detail. Your cut sheet is locked and will be hand-delivered to T-K Processing in Cañon City before your butcher date."}
      </p>
      <div style="background:#F9F6F1;border:1px solid #E5E0D8;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
        <p style="font-family:Arial,sans-serif;font-size:14px;color:#1A3D2B;margin:0 0 4px;font-weight:bold;">
          📅 What happens next
        </p>
        <p style="font-family:Arial,sans-serif;font-size:13px;color:#374151;margin:0;line-height:1.8;">
          1. We take your cut sheet to T-K Processing<br>
          2. Your beef is dry-aged 21–24 days<br>
          3. Cut, vacuum-sealed, and labeled to your specs<br>
          4. We'll email you when it's ready for pickup
        </p>
      </div>
      ${summaryHtml}
      <a href="${reviewLink}" style="display:block;background:#F5F0E8;color:#1A3D2B;text-align:center;padding:14px 24px;border-radius:10px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;border:2px solid #1A3D2B;margin:24px 0 8px;">
        Review My Cut Sheet →
      </a>
      <p style="color:#9CA3AF;font-size:12px;font-family:Arial,sans-serif;text-align:center;">
        Questions before ${butcherDate}? Reply to this email and we'll do our best to accommodate.
      </p>
    `;
    const htmlEmail = emailBase(content, preheader);
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
      to: mainCustomer.email,
      subject: halfValue ? 'Your cut sheet is locked ✅ — both halves confirmed' : `Your cut sheet is locked, ${firstName} ✅`,
      html: htmlEmail,
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
          to: 'orders@legacylandandcattleco.com',
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

      const partnerContent = `
        <h2 style="font-family:Georgia,serif;color:#0F0F0F;font-size:22px;margin:0 0 8px;">
          ${halfValue ? 'Both halves are locked. Nice work!' : `Your cut sheet is locked, ${firstName}. Nice work! 🔒`}
        </h2>
        <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;margin:0 0 20px;">
          We've got your cutting instructions and we'll make sure they get to the butcher before your animal goes in. Here's a summary of what you ordered:
        </p>

        ${summaryHtml}

        <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;margin:20px 0 0;">
          Questions or changes before butcher day? Reply to this email and we'll do our best to accommodate.
        </p>
      `;

      const htmlEmail = emailBase(partnerContent, 'Nice work — your beef order is all set.');

      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails
        .send({
          from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
          to: partnerCustomer.email,
          subject: halfValue ? 'Both halves are locked 🔒' : 'Your cut sheet is locked in 🔒',
          html: htmlEmail,
        })
        .catch((err) => console.error('Partner cut sheet lock email error:', err));
    }
  }

  return NextResponse.json({ success: true });
}
