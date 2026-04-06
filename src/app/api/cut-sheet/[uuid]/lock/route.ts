export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legacylandandcattleco.com';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const supabase = getSupabaseAdmin();

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
    .select('id, cut_sheet_partner_session_id')
    .eq('id', uuid)
    .single();

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
      // Send notification email to partner with cut sheet summary
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const summaryText = `
        <p>Hi ${partnerCustomer.name || 'there'},</p>
        <p>Your partner has locked the cut sheet for your split beef order.</p>
        <p>You can view the full cut sheet here:</p>
        <p><a href="${APP_URL}/session/${session.cut_sheet_partner_session_id}/review">View Cut Sheet</a></p>
        <p>— Legacy Land &amp; Cattle</p>
      `;

      await resend.emails.send({
        from: 'Legacy Land & Cattle <orders@legacylandandcattleco.com>',
        to: partnerCustomer.email,
        subject: 'Your cut sheet has been locked',
        html: summaryText,
      });
    }
  }

  return NextResponse.json({ success: true });
}
