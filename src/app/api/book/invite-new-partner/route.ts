export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 
  'https://www.legacylandandcattleco.com';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { session_id, new_partner_email, new_partner_name } 
    = await request.json();
  
  if (!session_id || !new_partner_email)
    return NextResponse.json(
      { error: 'Missing fields' }, { status: 400 });
  
  const newExpiry = new Date(
    Date.now() + 48 * 60 * 60 * 1000).toISOString();
  
  // Cancel old pending partner sessions
  const { data: session } = await supabase
    .from('sessions')
    .select('group_id, purchase_type, customers(name, email)')
    .eq('id', session_id).single();
  
  if (session?.group_id) {
    await supabase.from('sessions')
      .update({ status: 'cancelled' })
      .eq('group_id', session.group_id)
      .neq('id', session_id)
      .eq('status', 'pending');
  }
  
  // Update owner session with new partner info
  await supabase.from('sessions').update({
    partner_emails: [new_partner_email],
    partner_names: [new_partner_name || ''],
    invite_expires_at: newExpiry,
  }).eq('id', session_id);
  
  // Send new invite email
  await fetch(`${APP_URL}/api/book/send-partner-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id }),
  });
  
  return NextResponse.json({ success: true });
}
