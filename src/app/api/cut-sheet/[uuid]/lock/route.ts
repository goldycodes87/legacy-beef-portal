export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { emailBase, ctaButton, cutSheetSummary } from '@/lib/email-templates';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legacylandandcattleco.com';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const supabase = getSupabaseAdmin();
  const portalOrigin = request.nextUrl.origin;

  // Lock all sections for owner's session
  await supabase
    .from('cut_sheet_answers')
    .update({ locked: true })
    .eq('session_id', uuid);

  // Update session status
  await supabase
    .from('sessions')
    .update({ 
      status: 'locked',
      cut_sheet_complete: true,
      cut_sheet_locked_at: new Date().toISOString()
    })
    .eq('id', uuid);

  // Fetch this session to check for split partner
  const { data: session } = await supabase
    .from('sessions')
    .select(`
      id, cut_sheet_partner_session_id, access_token,
      customers (id, name, email),
      animals (name, butcher_date)
    `)
    .eq('id', uuid)
    .single();

  // Send confirmation email to main customer
  const mainCustomer = Array.isArray(
    (session as any)?.customers)
    ? (session as any).customers[0]
    : (session as any)?.customers;
  const mainAnimal = Array.isArray(
    (session as any)?.animals)
    ? (session as any).animals[0]
    : (session as any)?.animals;

  if (mainCustomer?.email) {
    const firstName = 
      mainCustomer.name?.split(' ')[0] ?? 'there';
    const butcherDate = mainAnimal?.butcher_date
      ? new Date(mainAnimal.butcher_date)
        .toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric'
        })
      : 'your scheduled date';
    const accessToken = (session as any)?.access_token;
    const reviewLink = accessToken
      ? `${APP_URL}/access/${accessToken}`
      : `${APP_URL}`;

    const { data: answers } = await supabase
      .from('cut_sheet_answers')
      .select('section, answers')
      .eq('session_id', uuid);

    const preheader = `Nice work, ${firstName} — your cut sheet is done.`;
    const content = `
      <table role="presentation" width="100%" style="border-radius:12px;margin:0 0 28px;"><tr><td bgcolor="#1A3D2B" style="background:linear-gradient(135deg,#1A3D2B 0%,#2d6a4f 100%);border-radius:12px;padding:28px 24px;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">✅</div>
        <h2 style="font-family:Georgia,serif;color:white;font-size:24px;margin:0 0 8px;font-weight:normal;">
          Your cut sheet is done, ${firstName}.
        </h2>
        <p style="color:#C4A46B;font-size:14px;margin:0;font-family:Arial,sans-serif;">
          We've got your cutting instructions.
        </p>
      </td></tr></table>
      <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 16px;">
        You just made the most important decision of this whole process — and we've got every detail. Your cut sheet is locked and will be hand-delivered to T-K Processing in Cañon City before your butcher date.
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
      ${cutSheetSummary(answers || [])}
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
      subject: `Your cut sheet is locked, ${firstName} ✅`,
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

    // Fetch partner session + customer for email
    const { data: partnerSession } = await supabase
      .from('sessions')
      .select('id, customers(name, email)')
      .eq('id', session.cut_sheet_partner_session_id)
      .single();

    const partnerCustomer = partnerSession?.customers as unknown as { name: string; email: string } | null;

    if (partnerCustomer?.email) {
      // Fetch cut sheet answers for summary
      const { data: answers } = await supabase
        .from('cut_sheet_answers')
        .select('section, answers')
        .eq('session_id', uuid);

      const firstName = partnerCustomer.name?.split(' ')[0] ?? 'there';
      
      const preheader = 'Nice work — your beef order is all set.';
      const content = `
        <h2 style="font-family:Georgia,serif;color:#0F0F0F;font-size:22px;margin:0 0 8px;">
          Your cut sheet is locked, ${firstName}. Nice work! 🔒
        </h2>
        <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;margin:0 0 20px;">
          We've got your cutting instructions and we'll make sure they get to the
          butcher before your animal goes in. Here's a summary of what you ordered:
        </p>

        ${cutSheetSummary(answers || [])}

        <p style="color:#6B7280;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;margin:20px 0 0;">
          Questions or changes before butcher day? Reply to this email and we'll
          do our best to accommodate.
        </p>
      `;

      const htmlEmail = emailBase(content, preheader);

      // Send notification email to partner with cut sheet summary
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
        to: partnerCustomer.email,
        subject: 'Your cut sheet is locked in 🔒',
        html: htmlEmail,
      });
    }
  }

  return NextResponse.json({ success: true });
}
