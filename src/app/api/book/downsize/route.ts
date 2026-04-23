export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 
  'https://www.legacylandandcattleco.com';

const DOWNSIZE_MAP: Record<string, string> = {
  whole: 'half',
  half: 'quarter',
};

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const session_id = 
    request.nextUrl.searchParams.get('session_id');
  
  if (!session_id)
    return new Response('Missing session_id', { status: 400 });
  
  const { data: session } = await supabase
    .from('sessions')
    .select('purchase_type, group_id')
    .eq('id', session_id).single();
  
  if (!session) 
    return new Response('Not found', { status: 404 });
  
  const newSize = DOWNSIZE_MAP[session.purchase_type];
  if (!newSize) 
    return new Response('Cannot downsize further', 
      { status: 400 });
  
  await supabase.from('sessions').update({
    purchase_type: newSize,
    is_splitting: false,
    group_role: 'solo',
    partner_emails: [],
    partner_names: [],
  }).eq('id', session_id);
  
  // Cancel pending partner sessions
  if (session.group_id) {
    await supabase.from('sessions')
      .update({ status: 'cancelled' })
      .eq('group_id', session.group_id)
      .neq('id', session_id)
      .eq('status', 'pending');
  }
  
  return Response.redirect(
    `${APP_URL}/session/${session_id}/status?converted=downsize`
  );
}
